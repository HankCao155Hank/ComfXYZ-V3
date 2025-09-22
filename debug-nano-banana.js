// 调试Nano Banana API调用
require('dotenv').config({ path: '.env.local' });

const API_KEY = process.env.GOOGLE_AI_API_KEY;
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

console.log("🔍 调试信息:");
console.log("API Key:", API_KEY ? `${API_KEY.substring(0, 10)}...` : "未设置");
console.log("API Key 格式:", API_KEY ? (API_KEY.startsWith('AIza') ? "✅ Google AI 格式" : "❌ 非Google AI格式") : "未设置");
console.log("API URL:", API_URL);

// 测试请求体
const testRequestBody = {
  contents: [
    {
      role: "user",
      parts: [
        { text: "一只可爱的小猫" }
      ]
    }
  ],
  generationConfig: {
    temperature: 0.9,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192
  },
  safetySettings: [
    { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
    { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
  ]
};

console.log("\n📤 请求体:");
console.log(JSON.stringify(testRequestBody, null, 2));

console.log("\n🌐 完整请求URL:");
console.log(`${API_URL}?key=${API_KEY ? API_KEY.substring(0, 10) + '...' : 'YOUR_API_KEY'}`);

// 如果有API key，尝试发送测试请求
if (API_KEY && API_KEY.startsWith('AIza')) {
  console.log("\n🧪 发送测试请求...");
  
  fetch(`${API_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(testRequestBody)
  })
  .then(async response => {
    console.log("响应状态:", response.status);
    console.log("响应头:", Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log("响应内容:", responseText);
    
    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText);
        console.log("错误详情:", errorData);
      } catch (e) {
        console.log("无法解析错误响应");
      }
    }
  })
  .catch(error => {
    console.error("请求失败:", error.message);
  });
} else {
  console.log("\n⚠️ 无法发送测试请求:");
  if (!API_KEY) {
    console.log("- API Key 未设置");
  } else {
    console.log("- API Key 格式不正确，应该是 AIza... 格式");
  }
}
