const express = require("express");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

const luck = {
    name: "LuckZbr",
    state: "SOCIAL",
    players: {},
    memories: []
};

app.get("/", (req, res) => {
    res.json({
        name: luck.name,
        online: true,
        state: luck.state
    });
});

app.get("/health", (req, res) => {
    res.json({
        ok: true,
        service: "luckzbr-backend"
    });
});

app.post("/chat", (req, res) => {
    const { player, message } = req.body;

    if (!player || !message) {
        return res.status(400).json({
            error: "player e message são obrigatórios"
        });
    }

    console.log(`[CHAT] ${player}: ${message}`);

    luck.memories.push({
        type: "chat",
        player: player,
        message: message,
        time: Date.now()
    });

    let response;

    const text = message.toLowerCase();

    if (text.includes("começar") || text.includes("comecar")) {
        luck.state = "ACTIVE";

        response =
            "Finalmente! Agora sim vamos começar essa série. Hehe.";
    } else {
        response =
            "Tô ouvindo, " + player + ". Ainda estou de boa aqui.";
    }

    res.json({
        ok: true,
        state: luck.state,
        response: response
    });
});

app.get("/state", (req, res) => {
    res.json({
        name: luck.name,
        state: luck.state
    });
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`LuckZbr Backend iniciado na porta ${PORT}`);
});
