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
    const { data } = await worker.search(query, top_k);
    res.json({ ok: true, results: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/ask', async (req, res) => {
  const { query, topK = 3, fileId } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  if (!openai) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    let contextText = '';
    
    if (fileId) {
      // Get all chunks for the specific file from the new worker endpoint
      try {
        const { data } = await axios.post(`${WORKER_URL}/file-content`, {
          path: fileId
        });
        
        if (data.success && data.content) {
          contextText = data.content;
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
      try {
        const { data } = await worker.search(query, topK);
        const searchResults = data.results || data || [];
        
        if (searchResults.length === 0) {
          return res.json({ summary: 'No relevant documents found for your query.' });
        }
        
        // Combine text from search results
        const contexts = searchResults.map((result, index) => {
          const text = result.text || result.content || '';
          const score = result.score || 0;
          return `Document ${index + 1} (relevance: ${score.toFixed(2)}):\n${text}`;
        });
        
        contextText = contexts.join('\n\n---\n\n');
      } catch (workerErr) {
        console.error('Error searching documents:', workerErr.message);
        return res.status(500).json({ error: 'Search service unavailable' });
      }
    }

    if (!contextText.trim()) {
      return res.json({ summary: 'No content available to summarize.' });
    }

    // Generate summary using OpenAI
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
      
      res.json({ summary });
      
    } catch (openaiErr) {
      console.error('OpenAI API error:', openaiErr.message);
      res.status(500).json({ error: 'Failed to generate summary' });
    }
    
  } catch (err) {
    console.error('Ask endpoint error:', err.message);
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
