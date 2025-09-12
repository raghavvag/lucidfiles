const express = require('express');
const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Initialize Google Text-to-Speech client
let ttsClient = null;
try {
  console.log('🔧 Initializing Google Text-to-Speech...');
  const textToSpeech = require('@google-cloud/text-to-speech');
  
  // Test if credentials are available before creating client
  const { GoogleAuth } = require('google-auth-library');
  const auth = new GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/cloud-platform']
  });
  
  // Try to get credentials asynchronously - don't block startup
  auth.getApplicationDefault().then(() => {
    ttsClient = new textToSpeech.TextToSpeechClient();
    console.log('✅ Google TTS client initialized with credentials');
  }).catch(credError => {
    console.warn('⚠️ Google TTS credentials not found:', credError.message);
    console.log('💡 To use Google TTS, set up credentials: https://cloud.google.com/docs/authentication/getting-started');
  });
  
} catch (error) {
  console.warn('⚠️ Google TTS not available:', error.message);
}

// Initialize system TTS as fallback
let systemTTS = null;
try {
  systemTTS = require('say');
  console.log('✅ System TTS available as fallback');
} catch (error) {
  console.log('⚠️ System TTS not available:', error.message);
}

// Keep ElevenLabs as backup option
let elevenlabs = null;
try {
  const { ElevenLabsClient } = require('elevenlabs');
  if (process.env.ELEVENLABS_API_KEY) {
    elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
    console.log('✅ ElevenLabs client available as backup');
  }
} catch (error) {
  console.log('⚠️ ElevenLabs not available');
}

/**
 * Create a simple silent WAV file as audio fallback
 */
function createSilentWAV(numSamples, sampleRate) {
  const dataSize = numSamples * 2; // 16-bit samples
  const fileSize = 44 + dataSize; // WAV header is 44 bytes
  
  const buffer = Buffer.alloc(fileSize);
  let offset = 0;
  
  // WAV header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
  buffer.write('WAVE', offset); offset += 4;
  
  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // chunk size
  buffer.writeUInt16LE(1, offset); offset += 2; // audio format (PCM)
  buffer.writeUInt16LE(1, offset); offset += 2; // num channels
  buffer.writeUInt32LE(sampleRate, offset); offset += 4; // sample rate
  buffer.writeUInt32LE(sampleRate * 2, offset); offset += 4; // byte rate
  buffer.writeUInt16LE(2, offset); offset += 2; // block align
  buffer.writeUInt16LE(16, offset); offset += 2; // bits per sample
  
  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(dataSize, offset); offset += 4;
  
  // Silent audio data (all zeros)
  buffer.fill(0, offset);
  
  return buffer;
}

// Initialize OpenAI client for content enhancement
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate audio using system TTS (macOS say command)
 */
// Function to generate audio using system TTS (macOS 'say' command)
async function generateSystemTTS(text, outputPath) {
  return new Promise((resolve, reject) => {
    // Clean up the text for TTS - remove bracketed instructions and simplify
    const cleanText = text
      .replace(/\[.*?\]/g, '') // Remove bracketed instructions like [Music fades in]
      .replace(/Narrator:\s*/g, '') // Remove "Narrator:" labels
      .replace(/\n\s*\n/g, '\n') // Remove double newlines
      .replace(/"/g, '\\"') // Escape quotes
      .trim();
    
    // Use Albert voice and AIFF format (native macOS format)
    const voice = 'Albert'; 
    const aiffPath = outputPath.replace('.wav', '.aiff');
    const command = `say -v "${voice}" "${cleanText}" -o "${aiffPath}"`;
    
    console.log(`🎤 Running system TTS with voice: ${voice}`);
    console.log(`📝 Text length: ${cleanText.length} characters`);
    
    require('child_process').exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error('System TTS error:', error.message);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.warn('System TTS warning:', stderr);
      }
      
      console.log('✅ System TTS completed successfully');
      resolve();
    });
  });
}

/**
 * Generate audio using Google Text-to-Speech
 */
async function generateGoogleTTS(text, voice = 'en-US-Neural2-D') {
  if (!ttsClient) {
    throw new Error('Google TTS client not available');
  }

  // Construct the request
  const request = {
    input: { text: text },
    voice: { 
      languageCode: voice.split('-').slice(0, 2).join('-'), // e.g., 'en-US'
      name: voice,
      ssmlGender: voice.includes('Neural2-D') || voice.includes('Neural2-A') ? 'MALE' : 'FEMALE'
    },
    audioConfig: { 
      audioEncoding: 'MP3',
      sampleRateHertz: 44100,
      effectsProfileId: ['headphone-class-device']
    },
  };

  // Performs the text-to-speech request
  const [response] = await ttsClient.synthesizeSpeech(request);
  return response.audioContent;
}

/**
 * Generate summary text for podcast using OpenAI
 */
async function generatePodcastScript(content, type = 'overview', duration = 3) {
  const maxTokens = Math.min(1500, duration * 200); // Roughly 200 tokens per minute
  
  const prompts = {
    podcast: `Create an engaging podcast conversation script between two hosts discussing the following content. Make it natural, conversational, and informative. Keep it around ${duration} minutes when spoken at normal pace:

Content: ${content}

Format as a natural dialogue with Host A and Host B taking turns. Include brief introductions and smooth transitions.`,
    
    overview: `Create a clear, engaging audio summary of the following content. Write it as a script for a single narrator. Make it informative yet accessible, suitable for audio listening. Target ${duration} minutes when spoken at normal pace:

Content: ${content}

Write in a natural speaking style with good flow and clear explanations.`
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert content writer who creates engaging audio scripts. Keep your responses focused and well-structured for spoken delivery."
        },
        {
          role: "user",
          content: prompts[type] || prompts.overview
        }
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || content;
  } catch (error) {
    console.error('Error generating podcast script:', error);
    // Fallback to original content if OpenAI fails
    return content.length > 1000 ? content.substring(0, 1000) + '...' : content;
  }
}

/**
 * POST /api/generate-podcast
 * Generate audio podcast using ElevenLabs TTS
 */
router.post('/generate-podcast', async (req, res) => {
  try {
    const { 
      selected_text, 
      related_sections = [], 
      audio_type = 'overview', 
      duration_minutes = 3 
    } = req.body;

    console.log('🎧 Generating podcast:', { audio_type, duration_minutes });

    // Validate input
    if (!selected_text && (!related_sections || related_sections.length === 0)) {
      return res.status(400).json({ 
        error: 'Either selected_text or related_sections must be provided' 
      });
    }

    // Prepare content for summarization
    let contentToSummarize = selected_text || '';
    if (related_sections && related_sections.length > 0) {
      const relatedText = related_sections
        .map(section => section.text || section.content || '')
        .join(' ')
        .substring(0, 2000); // Limit related content
      contentToSummarize = `${contentToSummarize} ${relatedText}`.trim();
    }

    if (!contentToSummarize) {
      return res.status(400).json({ error: 'No content provided for podcast generation' });
    }

    // Generate enhanced script using OpenAI
    console.log('📝 Generating podcast script...');
    const podcastScript = await generatePodcastScript(
      contentToSummarize, 
      audio_type, 
      duration_minutes
    );

    // Generate audio using available TTS services
    console.log('🎤 Converting text to speech...');
    
    let audioBuffer;
    let ttsMethod = 'none';
    
    try {
      // Try Google TTS first (if authenticated)
      if (ttsClient) {
        try {
          console.log('🎤 Trying Google Text-to-Speech...');
          
          const voiceName = 'en-US-Neural2-D'; // Professional male voice
          const audioContent = await generateGoogleTTS(podcastScript, voiceName);
          audioBuffer = Buffer.from(audioContent, 'binary');
          ttsMethod = 'google';
          
          console.log('✅ Generated audio with Google TTS');
          
        } catch (googleError) {
          console.error('Google TTS failed:', googleError.message);
          
          // Check if it's an authentication error
          if (googleError.message.includes('credentials') || googleError.message.includes('authentication')) {
            console.log('⚠️ Google TTS authentication failed, trying system TTS...');
            
            // Try system TTS
            if (systemTTS) {
              try {
                const tempAudioPath = path.join(__dirname, '../../temp_podcast.aiff');
                await generateSystemTTS(podcastScript, tempAudioPath);
                
                // Read the generated audio file
                audioBuffer = fs.readFileSync(tempAudioPath);
                ttsMethod = 'system';
                
                // Clean up temp file
                fs.unlinkSync(tempAudioPath);
                
                console.log('✅ Generated audio with System TTS');
                
              } catch (systemError) {
                console.error('System TTS failed:', systemError.message);
                throw new Error('Both Google TTS and System TTS failed');
              }
            } else {
              throw new Error('Google TTS authentication failed and no system TTS available');
            }
          } else {
            throw googleError;
          }
        }
      }
      // Try ElevenLabs if Google TTS is not available
      else if (elevenlabs) {
        try {
          console.log('🎤 Using ElevenLabs (Google TTS not available)...');
          const voiceId = "pNInz6obpgDQGcFmaJgB"; // Adam voice
          
          const audioResponse = await elevenlabs.generate({
            voice: voiceId,
            text: podcastScript,
            model_id: "eleven_multilingual_v2",
          });

          const chunks = [];
          for await (const chunk of audioResponse) {
            chunks.push(chunk);
          }
          audioBuffer = Buffer.concat(chunks);
          ttsMethod = 'elevenlabs';
          console.log('✅ Generated audio with ElevenLabs');
          
        } catch (elevenLabsError) {
          console.error('ElevenLabs error:', elevenLabsError.message);
          
          // Try system TTS as final fallback
          if (systemTTS) {
            try {
              console.log('🎤 Trying System TTS as final fallback...');
              const tempAudioPath = path.join(__dirname, '../../temp_podcast.aiff');
              await generateSystemTTS(podcastScript, tempAudioPath);
              
              audioBuffer = fs.readFileSync(tempAudioPath);
              ttsMethod = 'system';
              
              fs.unlinkSync(tempAudioPath);
              console.log('✅ Generated audio with System TTS (fallback)');
              
            } catch (systemError) {
              console.error('System TTS failed:', systemError.message);
              throw new Error('All TTS services failed');
            }
          } else {
            throw elevenLabsError;
          }
        }
      }
      // Try system TTS if no cloud services available
      else if (systemTTS) {
        try {
          console.log('🎤 Using System TTS (no cloud services available)...');
          const tempAudioPath = path.join(__dirname, '../../temp_podcast.aiff');
          await generateSystemTTS(podcastScript, tempAudioPath);
          
          audioBuffer = fs.readFileSync(tempAudioPath);
          ttsMethod = 'system';
          
          fs.unlinkSync(tempAudioPath);
          console.log('✅ Generated audio with System TTS');
          
        } catch (systemError) {
          console.error('System TTS failed:', systemError.message);
          throw systemError;
        }
      }
      // No TTS services available
      else {
        throw new Error('No TTS service available');
      }
    } catch (allTTSError) {
      console.error('All TTS methods failed:', allTTSError.message);
      console.log('⚠️ Creating silent audio placeholder with script in metadata...');
      
      // Create a 10-second silent audio file (44.1kHz, 16-bit, mono)
      const sampleRate = 44100;
      const duration = 10; // seconds
      const samples = sampleRate * duration;
      const silentBuffer = Buffer.alloc(samples * 2); // 16-bit = 2 bytes per sample
      
      // Create WAV header
      const wavHeader = Buffer.alloc(44);
      wavHeader.write('RIFF', 0);
      wavHeader.writeUInt32LE(36 + silentBuffer.length, 4);
      wavHeader.write('WAVE', 8);
      wavHeader.write('fmt ', 12);
      wavHeader.writeUInt32LE(16, 16);
      wavHeader.writeUInt16LE(1, 20);
      wavHeader.writeUInt16LE(1, 22);
      wavHeader.writeUInt32LE(sampleRate, 24);
      wavHeader.writeUInt32LE(sampleRate * 2, 28);
      wavHeader.writeUInt16LE(2, 32);
      wavHeader.writeUInt16LE(16, 34);
      wavHeader.write('data', 36);
      wavHeader.writeUInt32LE(silentBuffer.length, 40);
      
      audioBuffer = Buffer.concat([wavHeader, silentBuffer]);
      ttsMethod = 'silent';
    }

    console.log(`📻 Podcast generated successfully using ${ttsMethod} TTS`);
    console.log(`📊 Audio buffer size: ${audioBuffer.length} bytes`);

    // Set appropriate headers for audio file
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Disposition': 'attachment; filename="podcast.wav"',
      'Content-Length': audioBuffer.length,
      'X-Podcast-Script': Buffer.from(podcastScript).toString('base64'), // Include script in header
      'X-TTS-Method': ttsMethod, // Indicate which TTS method was used
      'Access-Control-Expose-Headers': 'X-TTS-Method,X-Podcast-Script'
    });

    // Send the audio file
    res.send(audioBuffer);

  } catch (error) {
    console.error('❌ Podcast generation error:', error);
    
    // Generate fallback silent audio for any TTS failure
    console.log('⚠️ Generating fallback silent audio due to TTS error');
    const sampleRate = 44100;
    const duration = Math.max(duration_minutes * 60, 10); // At least 10 seconds
    const numSamples = sampleRate * duration;
    const fallbackBuffer = createSilentWAV(numSamples, sampleRate);
    
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Disposition': 'attachment; filename="podcast_fallback.wav"',
      'Content-Length': fallbackBuffer.length,
      'X-Podcast-Fallback': 'true',
      'X-Podcast-Error': error.message,
      'X-Podcast-Script': Buffer.from(podcastScript || 'Error generating script').toString('base64'),
    });
    
    return res.send(fallbackBuffer);
  }
});

/**
 * GET /api/voices
 * Get available ElevenLabs voices
 */
router.get('/voices', async (req, res) => {
  try {
    const voices = await elevenlabs.voices.getAll();
    
    // Return a simplified list of voices
    const voiceList = voices.voices.map(voice => ({
      voice_id: voice.voice_id,
      name: voice.name,
      category: voice.category,
      description: voice.description,
      preview_url: voice.preview_url,
    }));

    res.json({ voices: voiceList });
  } catch (error) {
    console.error('Error fetching voices:', error);
    res.status(500).json({ error: 'Failed to fetch available voices' });
  }
});

/**
 * GET /api/test-tts
 * Test text-to-speech setup and return script
 */
router.post('/test-tts', async (req, res) => {
  try {
    const { text = "This is a test of the text-to-speech system." } = req.body;
    
    if (elevenlabs) {
      try {
        const audioResponse = await elevenlabs.generate({
          voice: "JBFqnCBsd6RMkjVDRZzb", // George voice
          text: text,
          model_id: "eleven_multilingual_v2",
        });

        const chunks = [];
        for await (const chunk of audioResponse) {
          chunks.push(chunk);
        }
        const audioBuffer = Buffer.concat(chunks);

        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Disposition': 'attachment; filename="test.mp3"',
          'Content-Length': audioBuffer.length,
        });

        res.send(audioBuffer);
      } catch (error) {
        console.error('ElevenLabs test error:', error);
        res.status(500).json({ 
          error: 'ElevenLabs test failed', 
          details: error.message,
          fallback_text: text
        });
      }
    } else {
      res.json({
        success: false,
        message: 'ElevenLabs not configured',
        text_provided: text,
        note: 'Configure ELEVENLABS_API_KEY to enable audio generation'
      });
    }
  } catch (error) {
    console.error('Test TTS error:', error);
    res.status(500).json({ 
      error: 'Test failed', 
      details: error.message 
    });
  }
});

module.exports = router;
