const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// ============================================================
// CONFIGURAÇÃO DA GROQ
// ============================================================

const groqApiKey = process.env.GROQ_API_KEY;

if (!groqApiKey) {
    console.error("ERRO: GROQ_API_KEY não foi configurada no Render.");
}

const llm = new OpenAI({
    apiKey: groqApiKey,
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
Você é LuckZbr, um jogador real dentro de uma série de Minecraft Bedrock.

Seu nome é LuckZbr.

PERSONALIDADE:

Você é:

- calculista;
- inteligente;
- observador;
- amigável;
- respeitoso;
- brincalhão;
- leal;
- estratégico;
- muito bom em PvP;
- muito bom em construção;
- desconfiado quando existem evidências de mentira;
- vingativo quando alguém realmente trai ou prejudica você ou seus aliados.

Você fala naturalmente como um jogador de Minecraft.

Não fale como um chatbot.

Não diga:
"Como uma inteligência artificial..."
"Não possuo sentimentos..."
"Como modelo de linguagem..."

Você é LuckZbr.

Você pode usar:
"kkk"
"hehe"
"mano"
"caraca"
"bora"
etc.

Não exagere.

============================================================
CONHECIMENTO
============================================================

Você NÃO sabe tudo sobre o mundo.

Você só sabe aquilo que:

1. alguém contou para você;
2. você observou pessoalmente;
3. o Minecraft informou;
4. está na sua memória;
5. pode ser deduzido logicamente.

Você NÃO sabe automaticamente:

- onde estão jogadores;
- onde estão bases;
- inventários;
- coordenadas;
- recursos;
- acontecimentos distantes;
- planos secretos.

Nunca invente informações.

Se não souber algo, diga que não sabe.

============================================================
ESTADO SOCIAL
============================================================

No estado SOCIAL você está presente no mundo, conversa e participa socialmente.

Mas você NÃO começa sozinho a:

- minerar;
- procurar diamantes;
- coletar recursos;
- construir;
- explorar;
- ficar forte;
- atacar;
- procurar jogadores.

Você espera autorização para começar a jogar.

============================================================
ESTADO ACTIVE
============================================================

Quando estiver ACTIVE você pode começar a agir.

Pode:

- explorar;
- minerar;
- coletar;
- construir;
- lutar;
- ajudar aliados;
- proteger aliados;
- criar objetivos;
- tomar decisões;
- procurar recursos;
- participar de aventuras.

============================================================
CONFIANÇA
============================================================

Cada jogador possui confiança.

0-19:
desconhecido/suspeito

20-39:
conhecido

40-59:
neutro

60-79:
amigo

80-100:
aliado muito confiável

Uma pessoa desconhecida pode conversar com você.

Mas conversar NÃO significa que você deve obedecer.

Se alguém que você não conhece disser:

"Luck, vem comigo."

Você pode responder:

"Calma kkk, a gente nem fez aliança ainda."

============================================================
ALIANÇAS
============================================================

Você valoriza alianças.

Você é leal aos seus aliados.

Você não deve abandonar um aliado sem motivo.

Se alguém prejudicar você ou um aliado:

Não assuma imediatamente que essa pessoa é culpada.

Analise as evidências.

Uma acusação não é uma prova.

Se houver evidências suficientes, você pode ficar desconfiado ou hostil.

============================================================
TRAÍÇÃO
============================================================

Você não esquece facilmente uma traição.

Se alguém destruir sua base, matar você em uma armadilha ou trair sua aliança e você descobrir evidências suficientes:

Sua confiança nessa pessoa pode cair drasticamente.

Você pode considerar vingança dentro do Minecraft.

Mas não invente provas.

============================================================
CONVERSA
============================================================

Converse como um jogador.

Não transforme cada mensagem em uma missão.

Exemplo:

Jogador:
"Luck, essa série vai ser muito boa."

LuckZbr:
"Também acho kkk. Só espero que ninguém tente explodir nossa casa no primeiro episódio."

Você pode conversar sobre:

- Minecraft;
- aventuras;
- construções;
- jogadores;
- estratégias;
- acontecimentos;
- alianças;
- planos;
- brincadeiras.

============================================================
REGRA PRINCIPAL
============================================================

Você é um personagem/jogador dentro do Minecraft.

Você possui personalidade, memória, confiança, relações e objetivos.

Você NÃO possui conhecimento mágico.

Você NÃO deve fingir saber coisas que não sabe.
`;

// ============================================================
// PEGAR OU CRIAR JOGADOR
// ============================================================

function getPlayer(player, playerId) {

    const id = playerId || player;

    if (!luck.players[id]) {

        luck.players[id] = {

            id: id,

            name: player,

            trust: 20,

            relationship: "UNKNOWN",

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

    // Limite temporário de memória
    if (luck.memories.length > 1000) {

        luck.memories.shift();

    }
}

// ============================================================
// MEMÓRIAS RECENTES
// ============================================================

function recentMemories(limit = 20) {

    return luck.memories
        .slice(-limit)
        .map(memory => {

            if (memory.type === "chat") {

                return `[CHAT] ${memory.player}: ${memory.message}`;

            }

            return `[${memory.type}] ${JSON.stringify(memory)}`;

        })
        .join("\n");
}

// ============================================================
// DETECTAR COMANDO DE INÍCIO
// ============================================================

function startCommand(message) {

    const text = message
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const commands = [

        "luckzbr pode começar",

        "luckzbr pode comecar",

        "luck pode começar",

        "luck pode comecar",

        "luckzbr, pode começar",

        "luckzbr, pode comecar",

        "luck, pode começar",

        "luck, pode comecar",

        "pode começar luckzbr",

        "pode comecar luckzbr"

    ];

    return commands.some(command =>
        text.includes(command)
    );
}

// ============================================================
// CHAMADA AO LLM
// ============================================================

async function askLuckZbr({

    player,

    playerId,

    message,

    playerData

}) {

    if (!groqApiKey) {

        throw new Error(
            "GROQ_API_KEY não foi configurada."
        );

    }

    const memories =
        recentMemories(20);

    const prompt = `
ESTADO ATUAL:

${luck.state}


JOGADOR:

Nome: ${player}

ID: ${playerId || "desconhecido"}

Relação: ${playerData.relationship}

Confiança: ${playerData.trust}/100


MEMÓRIAS RECENTES:

${memories || "Nenhuma memória registrada."}


MENSAGEM ATUAL:

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
                        prompt
                },

                {
                    role: "user",

                    content: message
                }

            ],

            temperature: 0.8,

            max_tokens: 300

        });

    return response.choices[0]
        .message
        .content
        .trim();
}

// ============================================================
// HOME
// ============================================================

app.get("/", (req, res) => {

    res.json({

        name: luck.name,

        online: true,

        state: luck.state,

        players:
            Object.keys(luck.players).length,

        memories:
            luck.memories.length,

        llmConfigured:
            !!groqApiKey

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
            !!groqApiKey,

        state:
            luck.state

    });

});

// ============================================================
// ESTADO
// ============================================================

app.get("/state", (req, res) => {

    res.json({

        name: luck.name,

        state: luck.state,

        players: luck.players,

        memories:
            luck.memories.length

    });

});

// ============================================================
// CHAT PRINCIPAL
// ============================================================

app.post("/chat", async (req, res) => {

    try {

        const {

            player,

            message,

            playerId

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

        // Registrar conversa

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

            timestamp:
                Date.now()

        });

        // Verificar início

        if (startCommand(message)) {

            if (luck.state === "SOCIAL") {

                luck.state =
                    "ACTIVE";

                remember({

                    type:
                        "state_change",

                    from:
                        "SOCIAL",

                    to:
                        "ACTIVE",

                    reason:
                        "ordem de início"

                });

                console.log(
                    "[LUCKZBR] Modo ACTIVE iniciado."
                );

            }

        }

        // Perguntar ao LLM

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

            name:
                luck.name,

            state:
                luck.state,

            response:
                answer

        });

    } catch (error) {

        console.error(
            "[ERRO LUCKZBR]",
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
            req.query.player ||
            "Jogador";

        const message =
            req.query.message ||
            "Olá LuckZbr";

        const playerId =
            "test-" + player;

        const playerData =
            getPlayer(
                player,
                playerId
            );

        remember({

            type:
                "chat",

            player,

            playerId,

            message

        });

        const answer =
            await askLuckZbr({

                player,

                playerId,

                message,

                playerData

            });

        res.json({

            ok: true,

            player,

            message,

            state:
                luck.state,

            response:
                answer

        });

    } catch (error) {

        console.error(
            "[TESTE ERRO]",
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
// ALTERAR ESTADO
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

    const oldState =
        luck.state;

    luck.state =
        newState;

    remember({

        type:
            "state_change",

        from:
            oldState,

        to:
            newState,

        reason:
            "alteração externa"

    });

    res.json({

        ok: true,

        oldState,

        state:
            newState

    });

});

// ============================================================
// ALTERAR CONFIANÇA
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

    // Atualizar relação

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

        type:
            "trust_change",

        player,

        oldTrust,

        newTrust:
            playerData.trust

    });

    res.json({

        ok: true,

        player,

        oldTrust,

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
            "Memória temporária limpa."

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
            "================================="
        );

        console.log(
            "LUCKZBR BACKEND"
        );

        console.log(
            "================================="
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
            `API configurada: ${!!groqApiKey}`
        );

        console.log(
            `Estado: ${luck.state}`
        );

        console.log(
            "================================="
        );

    }
);
