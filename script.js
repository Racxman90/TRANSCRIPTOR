document.addEventListener('DOMContentLoaded', () => {
    const audioInputArea = document.querySelector('.audio-input-area');
    const micIconCircle = document.querySelector('.mic-icon-circle');
    const micIcon = document.querySelector('.mic-icon-circle i');
    const uploadText = document.querySelector('.upload-text');
    const transcriptionOutput = document.querySelector('.transcription-output');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsModal = document.getElementById('settings-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const saveApiKeyBtn = document.getElementById('save-api-key-btn');
    const apiKeyInput = document.getElementById('api-key-input');
    const connectionStatus = document.getElementById('connection-status');
    
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const navMenu = document.getElementById('nav-menu');

    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });
    navMenu.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            navMenu.classList.remove('active');
        }
    });


    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        uploadText.textContent = 'Tu navegador no soporta la transcripción.';
        audioInputArea.style.cursor = 'not-allowed';
        updateStatus('error', 'Navegador no compatible');
        return;
    }

    const recognition = new SpeechRecognition();
    let isRecording = false;
    let final_transcript = '';
    let retryCount = 0;
    const MAX_RETRIES = 3;

    recognition.lang = 'es-CL';
    recognition.continuous = true;
    recognition.interimResults = true;

    const updateStatus = (status, title) => {
        connectionStatus.className = '';
        connectionStatus.classList.add(status);
        connectionStatus.title = title;
    };

    const addMessage = (sender, message, isHTML = false) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('chat-message', sender.toLowerCase());
        if (isHTML) {
            messageElement.innerHTML = `<p><strong>${sender}:</strong> ${message}</p>`;
        } else {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${sender}:</strong> `;
            p.appendChild(document.createTextNode(message));
            messageElement.appendChild(p);
        }
        transcriptionOutput.appendChild(messageElement);
        transcriptionOutput.scrollTop = transcriptionOutput.scrollHeight;
    };

    updateStatus('connecting', 'Conectando al servicio...');
    addMessage('Sistema', '¡Hola! Haz clic en el micrófono para empezar a grabar.');
    setTimeout(() => updateStatus('ok', 'Listo para grabar'), 1000);


    recognition.onstart = () => {
        isRecording = true;
        final_transcript = '';
        uploadText.textContent = 'Escuchando...';
        micIconCircle.style.backgroundColor = '#e74c3c';
        micIcon.classList.add('fa-beat');
        addMessage('Sistema', 'Estoy escuchando, habla cuando quieras...');
        retryCount = 0;
        updateStatus('ok', 'Grabando...');
    };

    recognition.onresult = (event) => {
        let interim_transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                final_transcript += event.results[i][0].transcript + '. ';
            } else {
                interim_transcript += event.results[i][0].transcript;
            }
        }
        
        let userMessage = transcriptionOutput.querySelector('.current-user-message');
        if (!userMessage) {
            const messageElement = document.createElement('div');
            messageElement.classList.add('chat-message', 'user', 'current-user-message');
            messageElement.innerHTML = `<p><strong>Usuario:</strong> <span></span></p>`;
            transcriptionOutput.appendChild(messageElement);
            userMessage = messageElement;
        }
        userMessage.querySelector('span').textContent = `"${final_transcript}${interim_transcript}"`;
        transcriptionOutput.scrollTop = transcriptionOutput.scrollHeight;
    };

    recognition.onerror = (event) => {
        console.error('Error de reconocimiento:', event.error);
        let errorMessage;
        updateStatus('error', `Error: ${event.error}`);
        switch(event.error) {
            case 'not-allowed':
            case 'service-not-allowed':
                errorMessage = "¡Oh, no! Necesito permiso para usar el micrófono. Búscalo en la configuración de tu navegador.";
                addMessage('Sistema', errorMessage);
                break;
            case 'no-speech':
                errorMessage = "No te escuché. ¿Puedes hablar un poco más fuerte o acercarte al micrófono?";
                addMessage('Sistema', errorMessage);
                break;
            case 'network':
                updateStatus('connecting', 'Reintentando conexión...');
                if (retryCount < MAX_RETRIES) {
                    retryCount++;
                    addMessage('Sistema', `Conexión perdida. Reintentando automáticamente... (Intento ${retryCount}/${MAX_RETRIES})`);
                    setTimeout(() => {
                        if (!isRecording) recognition.start();
                    }, 2000);
                } else {
                    updateStatus('error', 'Fallo de conexión permanente');
                    errorMessage = "El reintento automático falló. ¡Tu turno! <button id='retry-btn' class='retry-button'>Reintentar</button>";
                    addMessage('Sistema', errorMessage, true);
                    document.getElementById('retry-btn').addEventListener('click', () => {
                        retryCount = 0;
                        updateStatus('connecting', 'Reintentando conexión...');
                        if (!isRecording) recognition.start();
                    });
                }
                break;
            case 'audio-capture':
                errorMessage = "No puedo acceder a tu micrófono. ¿Estará siendo usado por otra aplicación?";
                addMessage('Sistema', errorMessage);
                break;
            default:
                errorMessage = `¡Ups! Hubo un error inesperado: '${event.error}'. ¿Intentamos de nuevo?`;
                addMessage('Sistema', errorMessage);
                break;
        }
    };

    recognition.onend = () => {
        isRecording = false;
        uploadText.textContent = 'Haz Clic para Grabar';
        micIconCircle.style.backgroundColor = '#551BB3';
        micIcon.classList.remove('fa-beat');
        
        let currentUserMessage = transcriptionOutput.querySelector('.current-user-message');
        if (currentUserMessage) {
            currentUserMessage.classList.remove('current-user-message');
        }

        if (final_transcript.trim().length > 0) {
            addMessage('Sistema', 'Grabación detenida. ¡Transcripción finalizada!');
        }
        updateStatus('ok', 'Listo para grabar');
    };

    audioInputArea.addEventListener('click', () => {
        if (isRecording) {
            recognition.stop();
        } else {
            recognition.start();
        }
    });

    settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        settingsModal.classList.add('visible');
        apiKeyInput.value = localStorage.getItem('userApiKey') || '';
    });

    modalCloseBtn.addEventListener('click', () => {
        settingsModal.classList.remove('visible');
    });

    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('visible');
        }
    });
    
    saveApiKeyBtn.addEventListener('click', () => {
        const apiKey = apiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem('userApiKey', apiKey);
            alert('¡Tu llave secreta ha sido guardada!');
        } else {
            localStorage.removeItem('userApiKey');
            alert('¡La llave secreta ha sido eliminada!');
        }
        settingsModal.classList.remove('visible');
    });
});
