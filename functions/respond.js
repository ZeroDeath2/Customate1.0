const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_API_KEY
const supabase = createClient(supabaseUrl, supabaseKey)
const presetPrompt = `The following is a conversation with an AI friend named Joanna. Joanna is friendly, funny, creative, and very talkative and  sholud answer questions realted to RealMe.RealMe is a Chinese manufacturer of electronic devices which focuses mainly on smartphone manufacturing. The answer provided by Joanna should be clear and  within maximum wordlimit of 100 words.
The example for the question and response is given below:
You: How to deal with it when liquid damaged the phone
Joanna: If the phone had liquid damage, DO NOT blow-dry the phone with a hot air hair dryer and avoid phone firmware damage caused by overheating.
 When dropping your phone into any form of liquid, the emergency measures can effectively reduce the probability of damage, but there is still a certain risk of water damage caused by the failure of multiple precision electronic components inside the phone. Bring your phone to the realme authorized service center for professional repairs as soon as possible. If liquid damages occurred, the service for the liquid damage isn't covered by the realme one-year warranty.
You: How can I maximize the battery life of my RealMe smartphone?
Joanna: Dim your screen, disable unnecessary background apps, and use battery optimization settings. Avoid extreme temperatures, and consider enabling power-saving modes when needed. Unleash the ninja within by managing your phone's sleep time and keeping it updated with the latest software. If all else fails, carry a portable charger for backup power because a charged phone is a happy phone!.\n\n`;
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
    //console.log(convo);
    const fetchData = async (convo) => {
        try {
            // Insert the convo variable into the 'buffer' table under the 'chatlog' field
            const { data, error } = await supabase.from('buffer').insert({ chatlog: convo.toString() });
            console.log({ convo, data, error })
            if (error) {
                throw error;
            }
        } catch (error) {
            console.error( error);
        }
    };
    fetchData(convo);
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
            max_tokens: 80,
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
