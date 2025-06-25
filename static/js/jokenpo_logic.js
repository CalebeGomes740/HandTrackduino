document.addEventListener('DOMContentLoaded', () => {
    // --- Elementos HTML da Câmera e Controles de Processamento ---
    const cameraFeed = document.getElementById('camera-feed');
    const cameraStatus = document.getElementById('camera-status');
    const startProcessingButton = document.getElementById('start-processing');
    const stopProcessingButton = document.getElementById('stop-processing');

    // --- Jokenpo HTML Elements (main scoreboard) ---
    const playerScoreSpan = document.getElementById('player-score');
    const aiScoreSpan = document.getElementById('ai-score');
    const tiesSpan = document.getElementById('ties'); // Elemento para empates no placar principal
    const roundsPlayedSpan = document.getElementById('rounds-played');
    const playerCurrentGestureSpan = document.getElementById('player-current-gesture');
    const aiCurrentChoiceSpan = document.getElementById('ai-current-choice');
    const playerChoiceIcon = document.getElementById('player-choice-icon');
    const aiChoiceIcon = document.getElementById('ai-choice-icon');

    // --- Game Feedback Area elements (below camera) ---
    const playerScoreMini = document.getElementById('player-score-mini');
    const aiScoreMini = document.getElementById('ai-score-mini');
    const tiesMini = document.getElementById('ties-mini'); // Elemento para empates no placar mini
    const roundResultMain = document.getElementById('round-result-main'); // Mensagem principal de resultado
    const countdownMessageElement = document.getElementById('countdown-message'); // Contagem regressiva

    // --- Control Buttons and Debug Info ---
    const playRoundButton = document.getElementById('play-round-button');
    const resetScoreboardButton = document.getElementById('reset-scoreboard');
    const handDetectedStatus = document.getElementById('hand-detected-status');
    const detectedGestureFeedback = document.getElementById('detected-gesture-feedback');
    const jokenpoJsonDisplay = document.getElementById('jokenpo-json-display');

    // --- Mapping Jokenpo Moves to Font Awesome Icons ---
    const jokenpoIcons = {
        "Pedra": "fas fa-hand-rock",
        "Papel": "fas fa-hand-paper",
        "Tesoura": "fas fa-hand-scissors",
        "Nenhum": "fas fa-question", // Default icon for "Nenhum" (None)
        "Indefinido": "fas fa-question" // For "Indefinido" (Undefined) gesture
    };

    // --- Function to update Jokenpo game state and UI ---
    async function updateJokenpoGameDisplay() {
        try {
            const response = await fetch('/jokenpo_game_status');
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            const data = await response.json();

            jokenpoJsonDisplay.textContent = JSON.stringify(data, null, 2);

            // Update camera status
            if (data.camera_is_active) {
                cameraStatus.textContent = 'Câmera do Backend Ativa';
                cameraStatus.style.backgroundColor = 'rgba(46, 204, 113, 0.8)'; // Verde
            } else {
                cameraStatus.textContent = 'Câmera do Backend Inativa/Erro';
                cameraStatus.style.backgroundColor = 'rgba(231, 76, 60, 0.8)'; // Vermelho
            }

            // Update main scoreboard elements
            playerScoreSpan.textContent = data.player_score;
            aiScoreSpan.textContent = data.ai_score;
            tiesSpan.textContent = data.ties; // Atualiza empates
            roundsPlayedSpan.textContent = data.rounds_played;

            // Update mini scoreboard (below camera)
            playerScoreMini.textContent = data.player_score;
            aiScoreMini.textContent = data.ai_score;
            tiesMini.textContent = data.ties; // Atualiza empates mini

            // Update player's and AI's choices and icons
            playerCurrentGestureSpan.textContent = data.player_choice;
            aiCurrentChoiceSpan.textContent = data.ai_choice;

            playerChoiceIcon.innerHTML = `<i class="${jokenpoIcons[data.player_choice]}"></i>`;
            aiChoiceIcon.innerHTML = `<i class="${jokenpoIcons[data.ai_choice]}"></i>`;

            // Update round result message and its color (main area)
            roundResultMain.textContent = data.result_message;
            roundResultMain.className = ''; // Reset classes
            // These class additions need to be prefixed to match the CSS
            if (data.result_message.includes('Você venceu!')) {
                roundResultMain.classList.add('jokenpo-won');
            } else if (data.result_message.includes('Robô venceu!')) {
                roundResultMain.classList.add('jokenpo-lost');
            } else if (data.result_message.includes('Empate!')) {
                roundResultMain.classList.add('jokenpo-draw');
            }

            // Update hand detection status
            if (data.hand_detected) {
                handDetectedStatus.textContent = 'Sim';
                handDetectedStatus.style.color = '#2ecc71';
            } else {
                handDetectedStatus.textContent = 'Não';
                handDetectedStatus.style.color = '#e74c3c';
            }

            // Update detected gesture feedback from backend
            detectedGestureFeedback.textContent = data.current_gesture_detected;

            // Update MediaPipe processing status and button states
            if (data.mediapipe_processing_active) {
                startProcessingButton.style.display = 'none';
                stopProcessingButton.style.display = 'inline-flex';
                // Habilita o botão "Jogar Rodada" SOMENTE se a fase for "waiting_start"
                playRoundButton.disabled = (data.game_phase !== "waiting_start");
            } else {
                startProcessingButton.style.display = 'inline-flex';
                stopProcessingButton.style.display = 'none';
                playRoundButton.disabled = true; // Desabilita se o processamento estiver inativo
            }

            // Update countdown message
            countdownMessageElement.textContent = data.countdown_message;

        } catch (error) {
            console.error('Error getting Jokenpo status:', error);
            roundResultMain.textContent = "Erro de Conexão com Backend.";
            roundResultMain.classList.add('jokenpo-lost'); // Prefixed here too
            cameraStatus.textContent = 'Erro de Conexão com Backend';
            cameraStatus.style.backgroundColor = 'rgba(231, 76, 60, 0.8)';
            playRoundButton.disabled = true;
        }
    }

    setInterval(updateJokenpoGameDisplay, 100);

    // --- Processing and Game Controls ---
    startProcessingButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/control_processing/start');
            const data = await response.json();
            console.log('Processing control:', data.message);
            updateJokenpoGameDisplay(); // Força atualização da UI
        } catch (error) {
            console.error('Error starting processing:', error);
        }
    });

    stopProcessingButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/control_processing/stop');
            const data = await response.json();
            console.log('Processing control:', data.message);
            updateJokenpoGameDisplay(); // Força atualização da UI
        } catch (error) {
            console.error('Error stopping processing:', error);
        }
    });

    playRoundButton.addEventListener('click', async () => {
        try {
            // Este botão agora APENAS inicia a fase de contagem regressiva no backend.
            // A lógica de jogada e pontuação acontece na thread da câmera.
            const response = await fetch('/play_jokenpo');
            const data = await response.json();
            console.log('Round Start Message:', data.message);

            if (data.status === "error") {
                alert(data.message); // Exibe alert se não conseguir iniciar a rodada
            }
            updateJokenpoGameDisplay(); // Força atualização da UI
        } catch (error) {
            console.error('Error initiating round:', error);
            alert('Não foi possível iniciar a rodada. Verifique a conexão com o servidor.');
        }
    });

    resetScoreboardButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/reset_jokenpo');
            const data = await response.json();
            console.log('Scoreboard Reset:', data.message);
            updateJokenpoGameDisplay(); // Força atualização da UI
        } catch (error) {
            console.error('Error resetting scoreboard:', error);
        }
    });

    updateJokenpoGameDisplay(); // Chama na inicialização
});