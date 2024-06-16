require("dotenv").config();
const express = require('express')
const bodyParser = require('body-parser')
const { Server } = require('socket.io')
const TelegramBot = require('node-telegram-bot-api');

const app = express()
app.use(bodyParser.json())

// TELEGRAM BOT instance
const token = process.env.TELEGRAM_TOKEN;
const bot = new TelegramBot(token, { polling: true, filepath: false });

const appserver = app.listen(process.env.PORT, () =>
    console.log(`Server started on ${process.env.PORT}`)
);

app.get('/', (req, res) => {
    res.status(200).json({ status: "server is running on port 8000" })
})

//SOCKET IO insance
const io = new Server(appserver, {
    cors: {
        origin: "*",
        credentials: true,
        transports: ['websocket', 'polling'],
    },
    // path: "/cha",
    // allowEIO3: true
});

bot.on('message', (message) => {
    console.log(message)
    try {
        // const message = req.body.message || req.body.channel_post;
        const adminId = message?.chat.id;
        const name = message?.chat.first_name || message.chat?.title || "admin";
        const text = message?.text || "";
        const reply = message?.reply_to_message;
        if (text.startsWith("/start")) {
            bot.sendMessage(adminId, `<b>Welcome to TelechatBot</b> \nYour unique chat Id is: ${adminId} \nUse this Id link Telegrambot Widget.`, { parse_mode: "HTML" })
        } else if (reply) {
            let replyText = reply.text || "";
            let visitorId = replyText.slice(8, 14);
            io.to(visitorId).emit(visitorId, { name, text, from: 'admin' });
        } else if (text) {
            io.emit(adminId, { name, text, from: 'admin' });
        }

    } catch (e) {
        // re.status(500).json({status:false})
        console.log(e)
    }

});


io.on("connection", (socket) => {
    // console.log('connetion etablish',socket.id)
    let messageReceived = false;
    let visitor ;
    let admin;
    socket.on('register', function (registerMsg) {
        admin = registerMsg.adminId;
        visitor =registerMsg.visitorId
        socket.join(registerMsg.visitorId);
    });
    socket.on('fromvisitor', function (msg) {
        messageReceived = true;
        // io.to(msg.visitorId).emit(msg.visitorId+msg.adminId, msg.msg);
        bot.sendMessage(msg.adminId, `Visitor:${msg.visitorId}\nHost:${msg.host}\nMsg:${msg.msg}`, { parse_mode: "HTML" })
    });
    socket.on('disconnect',  (abcd)=> {
        if (messageReceived) {
            bot.sendMessage(admin, `${visitor} Left.`, { parse_mode: "HTML" })
        }
    });
})