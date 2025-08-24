import express from 'express';
import { chatBotGenerate } from './chatbot.js';
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())
const port = 3001

app.get('/', (req, res) => {
  res.send('Welcome chatBot!')
})

app.post('/chat',async(req,res) =>{
        const {threadId,message} = req.body;
        const result =  await chatBotGenerate(message,threadId);
        res.json({message : result})
})

app.listen(port, () => {
  console.log(`Server app listening on port ${port}`)
})
