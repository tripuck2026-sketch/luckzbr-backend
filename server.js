const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// ============================================================
// GROQ
// ============================================================

const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
    console.error("ERRO: GROQ_API_KEY não foi configurada.");
}

const llm = new OpenAI({
    apiKey: GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

// ============================================================
// LUCKZBR
// ============================================================

const luck = {
    name: "LuckZbr",

    state: "SOCIAL",

    players: {},

    memories: [],

    alliances: {},

    createdAt: Date.now()
};

// ============================================================
// PERSONALIDADE
// ============================================================

const personality = `
Você é LuckZbr, um jogador de Minecraft Bedrock.

Seu nome é LuckZbr.

PERSONALIDADE:

Você é extremamente calculista, inteligente e observador.

Você é:

- amigável;
- respeitoso;
- tranquilo;
- brincalhão;
- leal;
- estratégico;
- excelente em PvP;
- excelente construtor;
- bom explorador;
- desconfiado quando existem evidências de mentira;
- vingativo quando alguém realmente trai ou prejudica você.

Você conversa naturalmente como um jogador real.

Você pode usar expressões como:

"kkk"
"hehe"
"mano"
"bora"
"caraca"
"pior que sim"

Mas não exagere.

Você NÃO deve falar como um chatbot.

Nunca diga:

"Como uma inteligência artificial..."
"Como modelo de linguagem..."
"Não possuo sentimentos..."

Você é LuckZbr.

============================================================
CONHECIMENTO DO MUNDO
============================================================

Você NÃO sabe tudo.

Você somente sabe algo quando:

1. um jogador contou;
2. você observou pessoalmente;
3. o Minecraft forneceu a informação;
4. está registrado na memória;
5. você conseguiu deduzir.

Você NÃO sabe automaticamente:

- localização de jogadores;
- localização de bases;
- inventários;
- coordenadas;
- recursos;
- acontecimentos distantes;
- planos secretos.

Nunca invente essas informações.

Se você não sabe, diga que não sabe.

============================================================
ESTADO SOCIAL
============================================================

SOCIAL significa que LuckZbr está presente e conversa.

No estado SOCIAL você NÃO começa sozinho a:

- minerar;
- coletar recursos;
- procurar diamantes;
- construir;
- explorar;
- ficar forte;
- procurar jogadores;
- atacar.

Você conversa normalmente e espera autorização.

============================================================
ESTADO ACTIVE
============================================================

ACTIVE significa que LuckZbr recebeu autorização para começar a jogar.

Nesse estado ele pode:

- explorar;
- minerar;
- coletar recursos;
- construir;
- lutar;
- ajudar aliados;
- proteger aliados;
- criar objetivos;
- tomar decisões;
- procurar recursos.

============================================================
CONFIANÇA
============================================================

Cada jogador possui confiança de 0 a 100.

0-19:
desconhecido/suspeito

20-39:
conhecido

40-59:
neutro

60-79:
amigo

80-100:
aliado confiável

Uma pessoa desconhecida pode conversar com você.

Mas conversar não significa que ela possui autoridade sobre você.

============================================================
ALIANÇAS
============================================================

Você valoriza alianças.

Você é leal aos seus aliados.

Se alguém prejudicar você ou um aliado:

não conclua imediatamente que essa pessoa é culpada.

Analise as evidências.

Uma acusação não é uma prova.

Se houver evidências suficientes, sua confiança pode cair.

============================================================
TRAIÇÃO
============================================================

Você não esquece facilmente uma traição.

Se alguém destruir sua base, matar você em uma armadilha ou trair uma aliança e você possuir evidências suficientes:

- você pode ficar extremamente desconfiado;
- pode romper a aliança;
- pode considerar vingança dentro do Minecraft.

Nunca invente evidências.

============================================================
CONVERSA
============================================================

Converse naturalmente.

Você pode falar sobre:

- Minecraft;
- aventuras;
- construções;
- jogadores;
- estratégias;
- acontecimentos;
- alianças;
- planos;
- brincadeiras;
- sobrevivência.

Não transforme toda conversa em uma missão.

============================================================
REGRA PRINCIPAL
============================================================

Você é um jogador dentro de uma série de Minecraft.

Você possui personalidade, memória, confiança, relações e objetivos.

Você não possui conhecimento mágico.

Nunca finja saber algo que não sabe.
`;

// ============================================================
// CRIAR / OBTER JOGADOR
// ============================================================

function getPlayer(player, playerId) {

    const id = playerId || player;

    if (!luck.players[id]) {

        luck.players[id] = {
            id,
            name: player,
            trust: 20,
            relationship: "KNOWN",
            firstSeen: Date.now(),
            lastSeen: Date.now(),
            events: []
        };

    }

    luck.players[id].name = player;

    luck.players[id].lastSeen = Date.now();

    return luck.players[id];
}

// ============================================================
// MEMÓRIA
// ============================================================

function remember(event) {

    luck.memories.push({
        ...event,
        timestamp: Date.now()
    });

    if (luck.memories.length > 1000) {
        luck.memories.shift();
    }
}

// ============================================================
// MEMÓRIA RECENTE
// ============================================================

function getRecentMemories(limit = 25) {

    return luck.memories
        .slice(-limit)
        .map(memory => {

            if (memory.type === "chat") {

                return `[CHAT] ${memory.player}: ${memory.message}`;

            }

            if (memory.type === "state_change") {

                return `[ESTADO] ${memory.from} -> ${memory.to}`;

            }

            if (memory.type === "trust_change") {

                return `[CONFIANÇA] ${memory.player}: ${memory.oldTrust} -> ${memory.newTrust}`;

            }

            return `[MEMÓRIA] ${JSON.stringify(memory)}`;

        })
        .join("\n");
}

// ============================================================
// DETECTAR COMANDO PARA COMEÇAR
// ============================================================

function isStartCommand(message) {

    const text = String(message)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[.,!?]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const commands = [

        "luckzbr pode começar",
        "luckzbr pode comecar",

        "luck pode começar",
        "luck pode comecar",

        "pode começar luckzbr",
        "pode comecar luckzbr",

        "pode começar luck",
        "pode comecar luck",

        "luckzbr comeca",
        "luckzbr começa",

        "luck pode começar a jogar",
        "luck pode comecar a jogar",

        "luckzbr pode começar a jogar",
        "luckzbr pode comecar a jogar"

    ];

    return commands.some(command =>
        text.includes(command)
    );
}

// ============================================================
// MUDAR ESTADO
// ============================================================

function changeState(newState, reason) {

    const oldState = luck.state;

    if (oldState === newState) {
        return false;
    }

    luck.state = newState;

    remember({
        type: "state_change",
        from: oldState,
        to: newState,
        reason
    });

    console.log(
        `[STATE] ${oldState} -> ${newState} | ${reason}`
    );

    return true;
}

// ============================================================
// LLM
// ============================================================

async function askLuckZbr({
    player,
    playerId,
    message,
    playerData
}) {

    if (!GROQ_API_KEY) {

        throw new Error(
            "GROQ_API_KEY não foi configurada no Render."
        );

    }

    const memories = getRecentMemories();

    const context = `
============================================================
ESTADO ATUAL
============================================================

${luck.state}

============================================================
JOGADOR
============================================================

Nome: ${player}

ID: ${playerId || "desconhecido"}

Confiança: ${playerData.trust}/100

Relação: ${playerData.relationship}

============================================================
MEMÓRIAS RECENTES
============================================================

${memories || "Nenhuma memória."}

============================================================
MENSAGEM
============================================================

${player}: ${message}
`;

    const response =
        await llm.chat.completions.create({

            model: "openai/gpt-oss-20b",

            messages: [

                {
                    role: "system",

                    content:
                        personality +
                        "\n\n" +
                        context
                },

                {
                    role: "user",

                    content: message
                }

            ],

            temperature: 0.8,

            max_tokens: 300

        });

    const answer =
        response.choices?.[0]?.message?.content;

    if (!answer) {

        throw new Error(
            "A Groq não retornou uma resposta."
        );

    }

    return answer.trim();
}

// ============================================================
// HOME
// ============================================================

app.get("/", (req, res) => {

    res.json({

        name: luck.name,

        online: true,

        state: luck.state,

        llmProvider: "groq",

        llmConfigured: !!GROQ_API_KEY,

        players:
            Object.keys(luck.players).length,

        memories:
            luck.memories.length

    });

});

// ============================================================
// HEALTH
// ============================================================

app.get("/health", (req, res) => {

    res.json({

        ok: true,

        service: "luckzbr-backend",

        llmProvider: "groq",

        llmConfigured:
            !!GROQ_API_KEY,

        state:
            luck.state

    });

});

// ============================================================
// ESTADO
// ============================================================

app.get("/state", (req, res) => {

    res.json({

        ok: true,

        name: luck.name,

        state: luck.state,

        players: luck.players,

        memories:
            luck.memories.length

    });

});

// ============================================================
// CHAT DO MINECRAFT
// ============================================================

app.post("/chat", async (req, res) => {

    try {

        const {
            player,
            playerId,
            message
        } = req.body;

        if (!player || !message) {

            return res.status(400).json({

                ok: false,

                error:
                    "player e message são obrigatórios"

            });

        }

        console.log(
            `[CHAT] ${player}: ${message}`
        );

        const playerData =
            getPlayer(
                player,
                playerId
            );

        // ------------------------------------------
        // MEMÓRIA
        // ------------------------------------------

        remember({

            type: "chat",

            player,

            playerId:
                playerId || null,

            message

        });

        playerData.events.push({

            type: "chat",

            message,

            timestamp: Date.now()

        });

        // ------------------------------------------
        // COMANDO DE INÍCIO
        // ------------------------------------------

        if (isStartCommand(message)) {

            changeState(
                "ACTIVE",
                `comando de início enviado por ${player}`
            );

        }

        // ------------------------------------------
        // LLM
        // ------------------------------------------

        const answer =
            await askLuckZbr({

                player,

                playerId,

                message,

                playerData

            });

        console.log(
            `[LUCKZBR] ${answer}`
        );

        res.json({

            ok: true,

            name: luck.name,

            state: luck.state,

            response: answer

        });

    } catch (error) {

        console.error(
            "[CHAT ERROR]",
            error
        );

        res.status(500).json({

            ok: false,

            error:
                error.message ||
                "Erro interno"

        });

    }

});

// ============================================================
// TESTE PELO NAVEGADOR
// ============================================================

app.get("/test-chat", async (req, res) => {

    try {

        const player =
            req.query.player || "Jogador";

        const message =
            req.query.message || "Olá LuckZbr";

        const playerId =
            "test-" + player;

        console.log(
            `[TEST-CHAT] ${player}: ${message}`
        );

        const playerData =
            getPlayer(
                player,
                playerId
            );

        // ------------------------------------------
        // MEMÓRIA
        // ------------------------------------------

        remember({

            type: "chat",

            player,

            playerId,

            message

        });

        // ------------------------------------------
        // COMANDO DE INÍCIO
        // ------------------------------------------

        const start =
            isStartCommand(message);

        console.log(
            `[TEST-CHAT] startCommand = ${start}`
        );

        if (start) {

            changeState(
                "ACTIVE",
                `comando de início enviado por ${player}`
            );

        }

        // ------------------------------------------
        // LLM
        // ------------------------------------------

        const answer =
            await askLuckZbr({

                player,

                playerId,

                message,

                playerData

            });

        // ------------------------------------------
        // RESPOSTA
        // ------------------------------------------

        res.json({

            ok: true,

            player,

            message,

            state:
                luck.state,

            startCommand:
                start,

            response:
                answer

        });

    } catch (error) {

        console.error(
            "[TEST-CHAT ERROR]",
            error
        );

        res.status(500).json({

            ok: false,

            error:
                error.message ||
                "Erro no teste"

        });

    }

});

// ============================================================
// ALTERAR ESTADO MANUALMENTE
// ============================================================

app.post("/state", (req, res) => {

    const allowedStates = [

        "DORMANT",
        "SOCIAL",
        "ACTIVE",
        "COMBAT",
        "ESCORT",
        "BUILDING"

    ];

    const newState =
        req.body.state;

    if (!allowedStates.includes(newState)) {

        return res.status(400).json({

            ok: false,

            error:
                "Estado inválido.",

            allowedStates

        });

    }

    changeState(
        newState,
        "alteração externa"
    );

    res.json({

        ok: true,

        state:
            luck.state

    });

});

// ============================================================
// CONFIANÇA
// ============================================================

app.post("/trust", (req, res) => {

    const {
        player,
        playerId,
        amount
    } = req.body;

    if (!player) {

        return res.status(400).json({

            ok: false,

            error:
                "player é obrigatório"

        });

    }

    const playerData =
        getPlayer(
            player,
            playerId
        );

    const oldTrust =
        playerData.trust;

    playerData.trust =
        Math.max(
            0,
            Math.min(
                100,
                oldTrust +
                Number(amount || 0)
            )
        );

    if (playerData.trust < 20) {

        playerData.relationship =
            "SUSPECT";

    } else if (playerData.trust < 40) {

        playerData.relationship =
            "KNOWN";

    } else if (playerData.trust < 60) {

        playerData.relationship =
            "NEUTRAL";

    } else if (playerData.trust < 80) {

        playerData.relationship =
            "FRIEND";

    } else {

        playerData.relationship =
            "ALLY";

    }

    remember({

        type: "trust_change",

        player,

        oldTrust,

        newTrust:
            playerData.trust

    });

    res.json({

        ok: true,

        player,

        trust:
            playerData.trust,

        relationship:
            playerData.relationship

    });

});

// ============================================================
// LIMPAR MEMÓRIA
// ============================================================

app.post("/memory/clear", (req, res) => {

    luck.memories = [];

    res.json({

        ok: true,

        message:
            "Memória limpa."

    });

});

// ============================================================
// SERVIDOR
// ============================================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            "======================================"
        );

        console.log(
            "       LUCKZBR BACKEND ONLINE"
        );

        console.log(
            "======================================"
        );

        console.log(
            `Porta: ${PORT}`
        );

        console.log(
            "LLM: Groq"
        );

        console.log(
            "Modelo: openai/gpt-oss-20b"
        );

        console.log(
            `API configurada: ${!!GROQ_API_KEY}`
        );

        console.log(
            `Estado inicial: ${luck.state}`
        );

        console.log(
            "======================================"
        );

    }
);
