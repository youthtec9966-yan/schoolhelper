const express = require('express');
const https = require('https');
const { SystemConfig } = require('../db');
const router = express.Router();

// 配置常量
const KEY_API_KEY = 'deepseek_api_key';
const KEY_KNOWLEDGE_BASE = 'ai_knowledge_base';

// 获取配置 (脱敏)
router.get('/config', async (req, res) => {
  try {
    const apiKeyConfig = await SystemConfig.findByPk(KEY_API_KEY);
    const kbConfig = await SystemConfig.findByPk(KEY_KNOWLEDGE_BASE);

    res.send({
      code: 0,
      data: {
        hasApiKey: !!(apiKeyConfig && apiKeyConfig.value),
        knowledgeBase: kbConfig ? kbConfig.value : ''
      }
    });
  } catch (err) {
    console.error('获取AI配置失败', err);
    res.send({ code: -1, error: '获取配置失败' });
  }
});

// 保存配置
router.post('/config', async (req, res) => {
  const { apiKey, knowledgeBase } = req.body;
  
  try {
    if (apiKey !== undefined) {
      await SystemConfig.upsert({ key: KEY_API_KEY, value: apiKey });
    }
    if (knowledgeBase !== undefined) {
      await SystemConfig.upsert({ key: KEY_KNOWLEDGE_BASE, value: knowledgeBase });
    }
    res.send({ code: 0, data: '配置已保存' });
  } catch (err) {
    console.error('保存AI配置失败', err);
    res.send({ code: -1, error: '保存配置失败' });
  }
});

// 测试 API Key
router.post('/test', async (req, res) => {
  const { apiKey } = req.body;
  
  if (!apiKey) {
    return res.send({ code: -1, error: '请提供 API Key' });
  }

  // 简单的测试请求：获取模型列表或发送一个简单的 hello
  // 由于模型列表接口可能不同，我们发送一个简单的 chat 请求
  const postData = JSON.stringify({
    model: "deepseek-chat",
    messages: [
      { role: "user", content: "Test connection. Reply 'OK' if you receive this." }
    ],
    max_tokens: 10
  });

  const options = {
    hostname: 'api.deepseek.com',
    path: '/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const apiReq = https.request(options, (apiRes) => {
    let data = '';
    apiRes.on('data', (chunk) => { data += chunk; });
    apiRes.on('end', () => {
      if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
        res.send({ code: 0, data: '连接成功' });
      } else {
        res.send({ code: -1, error: `连接失败 (Status: ${apiRes.statusCode})` });
      }
    });
  });

  apiReq.on('error', (e) => {
    res.send({ code: -1, error: '网络请求失败' });
  });

  apiReq.write(postData);
  apiReq.end();
});

// AI 对话接口
router.post('/chat', async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.send({ code: -1, error: 'Query is required' });
  }

  try {
    // 1. 获取配置
    const apiKeyConfig = await SystemConfig.findByPk(KEY_API_KEY);
    const kbConfig = await SystemConfig.findByPk(KEY_KNOWLEDGE_BASE);

    if (!apiKeyConfig || !apiKeyConfig.value) {
      return res.send({ code: -1, error: 'AI服务未配置 (API Key Missing)' });
    }

    const apiKey = apiKeyConfig.value;
    const knowledgeBase = kbConfig ? kbConfig.value : '';

    // 2. 构建 Prompt
    const systemPrompt = `你是一个大学校园助手。请根据以下的【校园知识库】来回答用户的问题。
如果问题不在知识库范围内，请礼貌地告知用户你暂时不知道，或者用你的通用知识尝试回答（需注明）。
回答要亲切、简练。

【校园知识库】：
${knowledgeBase}`;

    const messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: query }
    ];

    // 3. 调用 DeepSeek API
    const postData = JSON.stringify({
      model: "deepseek-chat",
      messages: messages,
      temperature: 0.7
    });

    const options = {
      hostname: 'api.deepseek.com',
      path: '/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const apiReq = https.request(options, (apiRes) => {
      let data = '';
      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
          try {
            const parsedData = JSON.parse(data);
            const content = parsedData.choices[0].message.content;
            res.send({ code: 0, data: content });
          } catch (e) {
            console.error('DeepSeek response parse error:', e, data);
            res.send({ code: -1, error: 'AI响应解析失败' });
          }
        } else {
          console.error('DeepSeek API error:', apiRes.statusCode, data);
          res.send({ code: -1, error: `AI服务请求失败: ${apiRes.statusCode}` });
        }
      });
    });

    apiReq.on('error', (e) => {
      console.error('DeepSeek request error:', e);
      res.send({ code: -1, error: 'AI服务连接失败' });
    });

    apiReq.write(postData);
    apiReq.end();

  } catch (err) {
    console.error('Chat API Error:', err);
    res.send({ code: -1, error: '服务器内部错误' });
  }
});

module.exports = router;
