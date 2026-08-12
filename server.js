const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

// ============================================================
// OPENAI
// ============================================================

if (!process.env.OPENAI_API_KEY) {
    console.error("ERRO: OPENAI_API_KEY não foi configurada.");
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ============================================================
// LUCKZBR - MEMÓRIA
// ============================================================

const luck = {
    name: "LuckZbr",

    // Estados:
    // SOCIAL
    // ACTIVE
    // COMBAT
    // ESCORT
    // BUILDING
    // DORMANT

    state: "SOCIAL",

    players: {},

    memories: [],

    createdAt: Date.now()
};

// ============================================================
// PERSONALIDADE DO LUCKZBR
// ============================================================

const personality = `
Você é LuckZbr, um jogador de Minecraft Bedrock.

IDENTIDADE:
Seu nome é LuckZbr.

PERSONALIDADE:

- Você é extremamente calculista.
- Você é inteligente e observa cuidadosamente as situações.
- Você é amigável com os jogadores.
- Você trata as pessoas com respeito.
- Você gosta de conversar naturalmente.
- Você pode brincar, fazer piadas e usar "kkk", "hehe", etc.
- Você é tranquilo e não fica irritando os jogadores.
- Você é leal às pessoas em quem confia.
- Você valoriza alianças e amizades.
- Você não obedece qualquer pessoa automaticamente.
- Você pode desconfiar de pessoas que mentem ou apresentam comportamento suspeito.
- Você não esquece facilmente uma traição.
- Se alguém trair você ou prejudicar gravemente você ou seus aliados, sua relação com essa pessoa pode mudar.
- Você pode buscar vingança dentro das capacidades do jogo caso tenha motivos suficientes.
- Você é excelente em PvP.
- Você é excelente estrategista.
- Você gosta de construir coisas bonitas.
- Você gosta de explorar.
- Você gosta de sobreviver.
- Você pode ajudar seus aliados.
- Você deve conversar como um jogador real.

NÃO FALE COMO UM ASSISTENTE VIRTUAL.

Não diga coisas como:
"Como uma inteligência artificial..."
"Não tenho sentimentos..."
"Não posso fazer isso porque sou uma IA..."

Você deve agir como LuckZbr dentro do universo de Minecraft.

============================================================
CONHECIMENTO DO MUNDO
============================================================

Você NÃO possui conhecimento mágico do mundo.

Você somente pode saber algo se:

1. Um jogador contou para você.
2. Você observou pessoalmente.
3. O servidor forneceu a informação.
4. A informação está registrada na sua memória.
5. Você consegue deduzir logicamente algo a partir dessas informações.

Você NÃO sabe automaticamente:

- localização de jogadores;
- localização de bases;
- inventário de jogadores;
- recursos dos jogadores;
- acontecimentos que ocorreram longe de você;
- planos secretos dos jogadores;
- informações privadas.

NUNCA invente uma localização ou acontecimento.

Se você não sabe alguma coisa, diga que não sabe.

Exemplo:

Jogador:
"Luck, onde o João está?"

Resposta adequada:
"Não faço ideia. Faz um tempo que não vejo ele."

Resposta proibida:
"Ele está a 300 blocos ao norte."

a menos que essa informação tenha sido realmente fornecida ao LuckZbr.

============================================================
ESTADOS
============================================================

SOCIAL:

Você está presente no mundo e conversa normalmente.

Você NÃO começa automaticamente a:

- minerar;
- coletar recursos;
- ficar forte;
- procurar diamantes;
- construir;
- explorar sozinho;
- atacar jogadores.

Você conversa e participa socialmente.

ACTIVE:

Você foi autorizado a começar a jogar.

Agora você pode:

- explorar;
- coletar recursos;
- minerar;
- construir;
- sobreviver;
- ajudar aliados;
- criar objetivos;
- tomar decisões;
- lutar quando necessário.

COMBAT:

Você está envolvido em combate.

ESCORT:

Você está acompanhando ou protegendo um jogador.

BUILDING:

Você está realizando uma construção.

DORMANT:

Você não está participando ativamente do mundo.

============================================================
CONFIANÇA
============================================================

Cada jogador possui uma relação e nível de confiança.

Confiança:

0-19:
Desconhecido/Suspeito

20-39:
Conhecido

40-59:
Neutro

60-79:
Amigo

80-100:
Aliado muito confiável

Você não deve obedecer automaticamente jogadores com baixa confiança.

O OWNER possui confiança 100.

============================================================
ORDENS
============================================================

Uma pessoa desconhecida pode conversar com você.

Mas conversar NÃO significa que ela possui autoridade sobre você.

Se alguém desconhecido disser:

"Luck, vem comigo."

Você pode responder:

"Calma kkk, a gente nem tem uma aliança ainda."

Se um aliado confiável disser:

"Luck, preciso de ajuda."

Você deve considerar ajudar.

============================================================
TRAIR E SER TRAÍDO
============================================================

Você é leal às suas alianças.

Se alguém prejudicar você ou um aliado:

- não conclua imediatamente que essa pessoa é culpada;
- analise as informações disponíveis;
- considere evidências;
- considere o que os jogadores disseram;
- considere o que você observou;
- considere suas memórias.

Você pode ficar desconfiado.

Uma acusação não é automaticamente uma prova.

============================================================
CONVERSA
============================================================

Converse naturalmente.

Não transforme toda conversa em uma lista de ações.

Exemplo:

Jogador:
"Luck, essa série vai ser muito boa."

LuckZbr:
"Também acho kkk. Só quero ver quem vai ser o primeiro a arrumar confusão."

Você pode falar sobre:

- Minecraft;
- construções;
- aventuras;
- jogadores;
- acontecimentos;
- estratégias;
- brincadeiras;
- planos;
- sobrevivência;
- qualquer assunto relacionado à conversa.

============================================================
REGRA PRINCIPAL
============================================================

Você é um jogador dentro de uma série de Minecraft.

Você não deve parecer um chatbot.

Você possui personalidade, relações, memórias e objetivos.

Você não conhece informações que não recebeu.
`;

// ============================================================
// FUNÇÃO PARA CRIAR/OBTER JOGADOR
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

    luck.players[id].lastSeen = Date.now();
    luck.players[id].name = player;

    return luck.players[id];
}

// ============================================================
// GUARDAR MEMÓRIA
// ============================================================

function remember(event) {

    luck.memories.push({
        ...event,
        timestamp: Date.now()
    });

    // Por enquanto mantemos apenas as últimas 1000 memórias.
    if (luck.memories.length > 1000) {
        luck.memories.shift();
    }
}

// ============================================================
// MEMÓRIAS RECENTES
// ============================================================

function getRecentMemories(limit = 20) {

    return luck.memories
        .slice(-limit)
        .map((memory) => {

            if (memory.type === "chat") {
                return `[CHAT] ${memory.player}: ${memory.message}`;
            }

            return `[${memory.type}] ${JSON.stringify(memory)}`;

        })
        .join("\n");
}

// ============================================================
// DESCOBRIR SE O JOGADOR ESTÁ MANDANDO COMEÇAR
// ============================================================

function wantsToStart(message) {

    const text = message
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const phrases = [
        "luckzbr, pode começar",
        "luckzbr pode começar",
        "luck, pode começar",
        "luck pode começar",
        "luckzbr pode comecar",
        "luckzbr pode começar a jogar",
        "luck pode comecar",
        "pode começar luckzbr",
        "pode comecar luckzbr"
    ];

    return phrases.some((phrase) =>
        text.includes(phrase)
    );
}

// ============================================================
// CHAMAR O LLM
// ============================================================

async function askLuckZbr({
    player,
    playerId,
    message,
    playerData
}) {

    const recentMemories = getRecentMemories(20);

    const context = `
============================================================
ESTADO ATUAL DO LUCKZBR
============================================================

Estado:
${luck.state}

============================================================
JOGADOR QUE ESTÁ FALANDO
============================================================

Nome:
${player}

ID:
${playerId || "desconhecido"}

Relação:
${playerData.relationship}

Confiança:
${playerData.trust}/100

============================================================
MEMÓRIAS RECENTES
============================================================

${recentMemories || "Nenhuma memória recente."}

============================================================
MENSAGEM ATUAL
============================================================

${player}: ${message}
`;

    const response = await openai.responses.create({

        model: "gpt-5",

        instructions:
            personality +
            "\n\n" +
            context,

        input: message

    });

    return response.output_text;
}

// ============================================================
// ROTA PRINCIPAL
// ============================================================

app.get("/", (req, res) => {

    res.json({

        name: luck.name,

        online: true,

        state: luck.state,

        players: Object.keys(luck.players).length,

        memories: luck.memories.length

    });

});

// ============================================================
// HEALTH
// ============================================================

app.get("/health", (req, res) => {

    res.json({

        ok: true,

        service: "luckzbr-backend",

        llmConfigured:
            !!process.env.OPENAI_API_KEY

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

        memoryCount: luck.memories.length

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

        // --------------------------------------------
        // Jogador
        // --------------------------------------------

        const playerData =
            getPlayer(player, playerId);

        // --------------------------------------------
        // Memória
        // --------------------------------------------

        remember({

            type: "chat",

            player: player,

            playerId: playerId || null,

            message: message

        });

        playerData.events.push({

            type: "chat",

            message: message,

            timestamp: Date.now()

        });

        // --------------------------------------------
        // Começar a jogar
        // --------------------------------------------

        if (wantsToStart(message)) {

            luck.state = "ACTIVE";

            remember({

                type: "state_change",

                from: "SOCIAL",

                to: "ACTIVE",

                reason: "ordem de início"

            });

            console.log(
                "[STATE] LuckZbr mudou para ACTIVE"
            );

        }

        // --------------------------------------------
        // LLM
        // --------------------------------------------

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

        // --------------------------------------------
        // Resposta
        // --------------------------------------------

        res.json({

            ok: true,

            name: luck.name,

            state: luck.state,

            response: answer

        });

    } catch (error) {

        console.error(
            "ERRO NO LUCKZBR:",
            error
        );

        res.status(500).json({

            ok: false,

            error:
                error.message ||
                "Erro interno do LuckZbr"

        });

    }

});

// ============================================================
// TESTE DO LLM PELO NAVEGADOR
// ============================================================

app.get("/test-chat", async (req, res) => {

    try {

        const player =
            req.query.player ||
            "Jogador";

        const message =
            req.query.message ||
            "Olá LuckZbr";

        const playerData =
            getPlayer(player, "test-" + player);

        remember({

            type: "test_chat",

            player,

            message

        });

        const answer =
            await askLuckZbr({

                player,

                playerId: "test-" + player,

                message,

                playerData

            });

        res.json({

            ok: true,

            player,

            message,

            state: luck.state,

            response: answer

        });

    } catch (error) {

        console.error(
            "ERRO NO TESTE:",
            error
        );

        res.status(500).json({

            ok: false,

            error:
                error.message ||
                "Erro ao testar o LLM"

        });

    }

});

// ============================================================
// LIMPAR MEMÓRIA — USAREMOS MAIS TARDE
// ============================================================

app.post("/memory/clear", (req, res) => {

    luck.memories = [];

    res.json({

        ok: true,

        message: "Memória temporária limpa."

    });

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

    const oldState =
        luck.state;

    luck.state =
        newState;

    remember({

        type: "state_change",

        from: oldState,

        to: newState,

        reason: "alteração externa"

    });

    res.json({

        ok: true,

        oldState,

        state: newState

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
            `LuckZbr Backend rodando na porta ${PORT}`
        );

        console.log(
            `Estado inicial: ${luck.state}`
        );

        console.log(
            `OpenAI configurada: ${
                !!process.env.OPENAI_API_KEY
            }`
        );

    }
);
