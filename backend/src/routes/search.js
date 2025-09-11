const express = require('express');
const axios = require('axios');
const OpenAI = require('openai');
const router = express.Router();
const worker = require('../lib/workerClient');
const db = require('../db');
const { OPENAI_API_KEY, WORKER_URL } = require('../config');

// Initialize OpenAI client
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

router.post('/search', async (req, res) => {
  const { query, top_k = 5 } = req.body;
  try {
    console.log('🔍 Search request:', query, `(top_k: ${top_k})`);
    const startTime = Date.now();
    const { data } = await worker.search(query, top_k);
    const duration = Date.now() - startTime;
    console.log(`✅ 🔍 Search completed in ${duration}ms - Found ${data.length} results`);
    res.json({ ok: true, results: data });
  } catch (err) {
    console.error('❌ 🔍 Search failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/ask', async (req, res) => {
  const { query, topK = 3, fileId } = req.body;
  console.log('🤖 Ask endpoint called with:', { query, topK, fileId });
  console.log('🔑 OpenAI client status:', !!openai);
  console.log('🔑 OPENAI_API_KEY exists:', !!OPENAI_API_KEY);
  
  if (!query) {
    console.log('❌ Missing query parameter');
    return res.status(400).json({ error: 'Query is required' });
  }

  if (!openai) {
    console.log('❌ 🤖 OpenAI client not initialized');
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    let contextText = '';
    
    if (fileId) {
      // Get all chunks for the specific file from the new worker endpoint
      console.log('📄 🔍 Fetching content for specific file:', fileId);
      try {
        const { data } = await axios.post(`${WORKER_URL}/file-content`, {
          path: fileId
        });
        
        if (data.success && data.content) {
          contextText = data.content;
          console.log('✅ 📄 File content retrieved successfully');
        } else {
          return res.status(404).json({ error: 'No content found for this file. File may not be indexed yet.' });
        }
        
      } catch (workerErr) {
        console.error('Error fetching file content from worker:', workerErr.message);
        
        // Fallback: try the search approach
        try {
          const fileName = fileId.split('\\').pop() || fileId.split('/').pop() || fileId;
          const { data } = await axios.post(`${WORKER_URL}/search`, {
            query: fileName,
            top_k: 20
          });
          const searchResults = data.results || data || [];
          
          if (searchResults.length === 0) {
            return res.status(404).json({ error: 'No content found for this file. File may not be indexed yet.' });
          }
          
          // Filter results that might be from this file and combine them
          const relevantChunks = searchResults
            .filter(result => {
              const metadata = result.metadata || {};
              const resultPath = metadata.filepath || metadata.file_path || metadata.source || '';
              const resultText = result.text || result.content || '';
              
              return resultPath.includes(fileId) || 
                     resultPath.includes(fileName) ||
                     resultText.includes(fileName);
            })
            .map(result => result.text || result.content || '');
          
          if (relevantChunks.length === 0) {
            contextText = searchResults
              .map(result => result.text || result.content || '')
              .filter(text => text.trim())
              .join('\n\n');
          } else {
            contextText = relevantChunks.join('\n\n');
          }
          
          if (!contextText.trim()) {
            return res.status(404).json({ error: 'No extractable content found for this file.' });
          }
          
        } catch (fallbackErr) {
          console.error('Fallback search also failed:', fallbackErr.message);
          return res.status(500).json({ error: 'Could not retrieve file content from search index' });
        }
      }
    } else {
      // Search and summarize top results
      console.log('🔍 📚 Performing semantic search for query:', query);
      try {
        const { data } = await worker.search(query, topK);
        const searchResults = data.results || data || [];
        
        if (searchResults.length === 0) {
          console.log('📭 No results found for query');
          return res.json({ summary: 'No relevant documents found for your query.' });
        }
        
        console.log(`✅ 🔍 Found ${searchResults.length} relevant documents`);
        // Combine text from search results
        const contexts = searchResults.map((result, index) => {
          const text = result.text || result.content || '';
          const score = result.score || 0;
          return `Document ${index + 1} (relevance: ${score.toFixed(2)}):\n${text}`;
        });
        
        contextText = contexts.join('\n\n---\n\n');
      } catch (workerErr) {
        console.error('❌ 🔍 Error searching documents:', workerErr.message);
        return res.status(500).json({ error: 'Search service unavailable' });
      }
    }

    if (!contextText.trim()) {
      return res.json({ summary: 'No content available to summarize.' });
    }

    // Generate summary using OpenAI
    console.log('🤖 Generating AI summary/response...');
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: fileId 
              ? 'You are a helpful assistant that summarizes documents. Provide a clear and concise summary of the given document content.'
              : 'You are a helpful assistant that answers questions based on search results. Analyze the provided documents and answer the user\'s question comprehensively.'
          },
          {
            role: 'user',
            content: fileId
              ? `Please summarize this document:\n\n${contextText}`
              : `Based on these search results, please answer this question: "${query}"\n\nSearch Results:\n${contextText}`
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const summary = response.choices[0]?.message?.content || 'Unable to generate summary.';
      console.log('✅ 🤖 AI response generated successfully');
      
      res.json({ summary });
      
    } catch (openaiErr) {
      console.error('❌ 🤖 OpenAI API error:', openaiErr.message);
      res.status(500).json({ error: 'Failed to generate summary' });
    }
    
  } catch (err) {
    console.error('Ask endpoint error - Full error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      response: err.response?.data
    });
    res.status(500).json({ error: err.message });
  }
});

// Legacy ask endpoint (for backward compatibility)
router.post('/ask-legacy', async (req, res) => {
  const { question, top_k = 5 } = req.body;
  try {
    const { data } = await worker.ask(question, top_k);
    res.json({ ok: true, answer: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
