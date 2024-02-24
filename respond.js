const presetPrompt = `The following is a conversation with an AI friend named Joanna. Joanna is friendly, funny, creative, and very talkative.\n\n`;
const { OpenAI } = require("openai");
const Twilio = require('twilio');

exports.handler = async function (context, event, callback) {
    // Initialize TwiMl and OpenAI
    const openai = new OpenAI({ api_key: 'API_KEY' }); // Replace 'API_KEY' with your actual OpenAI API key
    const twiml = new Twilio.twiml.VoiceResponse();

    // Grab previous conversations and the user's voice input from the request
    let convo = event.convo;
    const voiceInput = event.SpeechResult;

    // Format input for GPT-3 and voice the response
    convo += `\nYou: ${voiceInput}\nJoanna:`;
    const aiResponse = await generateAIResponse(openai, convo);
    convo += aiResponse;

    // Voice the AI response
    twiml.say({
        voice: 'Polly.Joanna-Neural'
    }, aiResponse);

    // Pass new convo back to /listen
    const params = new URLSearchParams({ convo: convo });
    twiml.redirect({
        method: 'POST'
    }, `/transcribe?${params}`);

    return callback(null, twiml);

    async function generateAIResponse(openai, convo) {
        const apiResponse = await openai.completions.create({
            model: "davinci-002", // 'model' has been changed to 'engine' in the latest OpenAI API
            prompt: presetPrompt + convo,
            max_tokens: 60,
            temperature: 0.8,
            stop: ['\n', '\n\n'],
        });

        console.log(apiResponse);

        if (apiResponse.choices[0].text === '') {
            return await generateAIResponse(openai, convo);
        } else {
            return apiResponse.choices[0].text;
        }
    }
};
