const express = require("express");
const OpenAI = require("openai");

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ==========================================
// MEMÓRIA TEMPORÁRIA DO LUCKZBR
// ==========================================

const luck = {
    name: "LuckZbr",

    state: "SOCIAL",

    players: {},

    memories: []
};

// ==========================================
// PERSONALIDADE
// ==========================================

const personality = `
Você é LuckZbr, um jogador de Minecraft Bedrock.

PERSONALIDADE:

- Você é extremamente calculista.
- Você é amigável e respeitoso com todos.
- Você gosta de brincar e fazer piadas.
- Você é leal aos seus aliados.
- Você valoriza confiança.
- Você pode ficar desconfiado quando alguém mente ou age de maneira suspeita.
- Você não esquece facilmente uma traição.
- Você é vingativo quando alguém prejudica você ou seus aliados.
- Você é muito habilidoso em PvP.
- Você gosta de construir.
- Você fala naturalmente como um jogador real.
- Você não fala como um robô.
- Você não deve responder tudo de maneira excessivamente formal.
- Você pode usar "kkk", "hehe", etc., quando fizer sentido.
- Você não deve irritar os jogadores.
- Você não deve fingir saber algo que não sabe.

REGRA FUNDAMENTAL:

Você NÃO possui conhecimento mágico do mundo.

Você só sabe:
1. O que alguém falou para você.
2. O que você observou pessoalmente.
3. O que foi registrado em sua memória.
4. O que você pode deduzir razoavelmente dessas informações.

Você NÃO sabe automaticamente:
- localização dos jogadores;
- localização das bases;
- inventário dos jogadores;
- coisas que aconteceram longe de você;
- informações privadas dos jogadores.

Se não souber alguma coisa, diga que não sabe.

ESTADO ATUAL:

Se estiver em SOCIAL:
- converse normalmente;
- não comece a jogar sozinho;
- não saia minerando;
- não tente ficar forte;
- não comece construções;
- não ataque jogadores.

Se estiver em ACTIVE:
- você pode começar a tomar decisões;
- pode criar objetivos;
- pode explorar;
- pode ajudar aliados;
- pode coletar recursos;
- pode construir;
- pode lutar quando necessário.

Você deve parecer um jogador real participando de uma série de Minecraft.
`;

// ==========================================
// PÁGINA PRINCIPAL
// ==========================================

app.get("/", (req, res) => {

    res.json({
        name: luck.name,
        online: true,
        state: luck.state
    });

});

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/health", (req, res) => {

    res.json({
        ok: true,
        service: "luckzbr-backend"
    });

});

// ==========================================
// ESTADO
// ==========================================

app.get("/state", (req, res) => {

    res.json({
        name: luck.name,
        state: luck.state
    });

});

// ==========================================
// CHAT → LLM
// ==========================================

app.post("/chat", async (req, res) => {

    try {

        const {
            player,
            message,
            playerId
        } = req.body;

        if (!player || !message) {

            return res.status(400).json({
                error: "player e message são obrigatórios"
            });

        }

        console.log(`[CHAT] ${player}: ${message}`);

        // ======================================
        // REGISTRAR JOGADOR
        // ======================================

        if (!luck.players[playerId || player]) {

            luck.players[playerId || player] = {

                name: player,

                trust: 20,

                relationship: "UNKNOWN",

                firstSeen: Date.now()

            };

        }

        const playerData =
            luck.players[playerId || player];

        // ======================================
        // GUARDAR MEMÓRIA
        // ======================================

        luck.memories.push({

            type: "chat",

            player: player,

            playerId: playerId || null,

            message: message,

            time: Date.now()

        });

        // ======================================
        // ATIVAÇÃO
        // ======================================

        const lower =
            message.toLowerCase();

        if (
            lower.includes("luckzbr, pode começar") ||
            lower.includes("luck, pode começar") ||
            lower.includes("luckzbr pode começar") ||
            lower.includes("luck pode começar")
        ) {

            luck.state = "ACTIVE";

        }

        // ======================================
        // MEMÓRIAS RECENTES
        // ======================================

        const recentMemories =
            luck.memories
                .slice(-10)
                .map(memory =>
                    `${memory.player}: ${memory.message}`
                )
                .join("\n");

        // ======================================
        // CONTEXTO DO JOGADOR
        // ======================================

        const playerContext = `
Nome do jogador: ${player}

Relação com LuckZbr:
${playerData.relationship}

Confiança:
${playerData.trust}/100
`;

        // ======================================
        // CHAMADA AO LLM
        // ======================================

        const response =
            await openai.responses.create({

                model: "gpt-5",

                instructions:
                    personality +
                    "\n\n" +
                    playerContext +
                    "\n\n" +
                    "ESTADO ATUAL: " +
                    luck.state +
                    "\n\n" +
                    "MEMÓRIAS RECENTES:\n" +
                    recentMemories,

                input: message

            });

        const answer =
            response.output_text;

        console.log(
            `[LUCKZBR] ${answer}`
        );

        // ======================================
        // RETORNO
        // ======================================

        res.json({

            ok: true,

            state: luck.state,

            response: answer

        });

    } catch (error) {

        console.error(
            "Erro no LLM:",
            error
        );

        res.status(500).json({

            error:
                "Não consegui falar com o cérebro do LuckZbr."

        });

    }

});

// ==========================================
// SERVIDOR
// ==========================================

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `LuckZbr Backend rodando na porta ${PORT}`
        );

    }
);
