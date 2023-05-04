import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import {Configuration, OpenAIApi} from 'openai';
import mongoose from 'mongoose';

dotenv.config();

mongoose.connect(process.env.MONGO_URI ?? '');

const chatSchema = new mongoose.Schema({
    content: String,
    role: String
});

const Chat = mongoose.model('Chat', chatSchema);

const conf = new Configuration({  
    apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(conf);
const app = express();


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/chat', async (req, res) => {
    const {content} = req.body;
    const messages = await Chat.find();
    const response = await main([
        ...messages.map(message => ({content: message.content, role: message.role})),
        {
            content,
            role: 'user'
        }
    ]);
    const userChat = new Chat({content, role: 'user'});
    await userChat.save();
    const assistantChat = new Chat({content: response, role: 'assistant'});
    await assistantChat.save();
    res.status(200).json({response});
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});

async function main(messages: any[]) {
    const result = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages
    });
    return result.data.choices[0].message?.content ?? 'No estoy disponible en el momento, por favor intenta más tarde';
}