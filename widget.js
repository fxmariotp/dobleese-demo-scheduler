/* ==========================================================================
   WIDGET SCRIPT - DOBLEESE AI SCHEDULER WIDGET
   ========================================================================== */

(function() {
    // Evitar doble inicialización
    if (window.__dobleese_widget_loaded) return;
    window.__dobleese_widget_loaded = true;

    // Estado local del widget
    let widgetState = {
        isOpen: false,
        step: 0,
        currentLead: {
            name: "",
            phone: "",
            email: "",
            treatment: "",
            value: 100,
            location: "",
            timePref: "",
            isPrioritary: false,
            date: "Ahora",
            status: "Pendiente"
        }
    };

    // Cargar dependencias (FontAwesome si no está presente)
    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fa = document.createElement("link");
        fa.rel = "stylesheet";
        fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
        document.head.appendChild(fa);
    }

    // Inicializar el DOM del widget
    document.addEventListener("DOMContentLoaded", () => {
        createWidgetDOM();
        bindWidgetEvents();
        bindPageTriggers();
    });

    // Crear elementos HTML del chatbot en el body
    function createWidgetDOM() {
        const container = document.createElement("div");
        container.id = "dobleese-widget-root";
        container.innerHTML = `
            <!-- Launcher -->
            <div class="chat-launcher" id="widget-chat-launcher">
                <i class="fa-solid fa-comment-dots fa-lg"></i>
                <div class="chat-launcher-badge" style="display: none;">1</div>
            </div>

            <!-- Ventana del chat -->
            <div class="chat-window" id="widget-chat-window">
                <div class="chat-header">
                    <div class="chat-bot-avatar">D</div>
                    <div class="chat-bot-info">
                        <div class="chat-bot-name">Asistente Dobleese</div>
                        <div class="chat-bot-status">En línea y listo</div>
                    </div>
                    <button class="chat-close-btn" id="widget-chat-close-btn">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>

                <div class="chat-body" id="widget-chat-body">
                    <!-- Los mensajes se inyectan dinámicamente -->
                </div>

                <div class="chat-footer">
                    Desarrollado con <i class="fa-solid fa-bolt" style="color: #fcb900;"></i> para <a href="#">Dobleese</a>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // Mostrar el badge después de unos segundos
        setTimeout(() => {
            const badge = document.querySelector(".chat-launcher-badge");
            if (badge) badge.style.display = "flex";
        }, 3000);
    }

    // Vincular eventos internos del widget
    function bindWidgetEvents() {
        const launcher = document.getElementById("widget-chat-launcher");
        const closeBtn = document.getElementById("widget-chat-close-btn");
        const chatWindow = document.getElementById("widget-chat-window");

        const toggleChat = () => {
            widgetState.isOpen = !widgetState.isOpen;
            if (widgetState.isOpen) {
                chatWindow.classList.add("active");
                const badge = document.querySelector(".chat-launcher-badge");
                if (badge) badge.style.display = "none";
                
                if (widgetState.step === 0) {
                    runChatbotFlow();
                }
            } else {
                chatWindow.classList.remove("active");
            }
        };

        launcher.addEventListener("click", toggleChat);
        closeBtn.addEventListener("click", toggleChat);

        // Guardar la función de abrir en el scope global por si acaso
        window.openDobleeseChat = () => {
            if (!widgetState.isOpen) toggleChat();
        };
    }

    // Capturar clics en enlaces y formularios del sitio
    function bindPageTriggers() {
        // Enlazar clics a botones de pedir cita
        const targetSelectors = [
            "a[href='#form']", 
            "a[href='#old-form-section']", 
            ".btn-a-medium", 
            ".old-btn", 
            ".old-cta-nav",
            ".premium-cta-btn",
            ".premium-btn-primary"
        ];

        document.addEventListener("click", (e) => {
            const target = e.target;
            
            // Comprobar si el elemento clicado o alguno de sus padres coincide con los selectores
            const matchSelector = targetSelectors.find(sel => {
                return target.closest(sel);
            });

            if (matchSelector) {
                e.preventDefault();
                window.openDobleeseChat();
            }
        });

        // Interceptar formularios tradicionales (ej: Contact Form 7)
        document.addEventListener("submit", (e) => {
            const form = e.target;
            if (form.classList.contains("wpcf7-form") || form.closest(".old-form-container")) {
                e.preventDefault();
                alert("⚠️ NOTA DEL PRESENTADOR:\n\nEste formulario clásico enviaría un email genérico que el personal de recepción tardaría hasta 24 horas en gestionar.\n\nPara mostrarle al cliente el beneficio del agendamiento inmediato, activaremos el asistente conversacional.");
                window.openDobleeseChat();
            }
        });
    }

    // ==========================================================================
    // FLUJO CONVERSACIONAL DEL CHATBOT
    // ==========================================================================
    function appendBotMessage(text, callback) {
        const chatBody = document.getElementById("widget-chat-body");
        if (!chatBody) return;

        const typing = document.createElement("div");
        typing.className = "typing-indicator";
        typing.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        chatBody.appendChild(typing);
        chatBody.scrollTop = chatBody.scrollHeight;

        setTimeout(() => {
            typing.remove();

            const row = document.createElement("div");
            row.className = "msg-row bot";
            row.innerHTML = `
                <div class="chat-bot-avatar">D</div>
                <div class="msg-bubble">${text}</div>
            `;
            chatBody.appendChild(row);
            chatBody.scrollTop = chatBody.scrollHeight;

            if (callback) callback();
        }, 1200);
    }

    function appendUserMessage(text) {
        const chatBody = document.getElementById("widget-chat-body");
        if (!chatBody) return;

        const row = document.createElement("div");
        row.className = "msg-row user";
        row.innerHTML = `
            <div class="msg-bubble">${text}</div>
        `;
        chatBody.appendChild(row);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function renderOptions(options, onSelect) {
        const chatBody = document.getElementById("widget-chat-body");
        if (!chatBody) return;

        const container = document.createElement("div");
        container.className = "chat-options-container";

        options.forEach(opt => {
            const btn = document.createElement("button");
            btn.className = "chat-option-btn";
            btn.innerText = opt.label;
            btn.addEventListener("click", () => {
                container.remove();
                appendUserMessage(opt.label);
                onSelect(opt.value, opt.label);
            });
            container.appendChild(btn);
        });

        chatBody.appendChild(container);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function renderForm(inputs, onSubmit) {
        const chatBody = document.getElementById("widget-chat-body");
        if (!chatBody) return;

        const form = document.createElement("div");
        form.className = "chat-form";

        const inputElements = [];
        inputs.forEach(inp => {
            const input = document.createElement("input");
            input.type = inp.type;
            input.className = "chat-input";
            input.placeholder = inp.placeholder;
            input.required = true;
            form.appendChild(input);
            inputElements.push(input);
        });

        setTimeout(() => inputElements[0].focus(), 100);

        const submit = document.createElement("button");
        submit.className = "chat-submit-btn";
        submit.innerText = "Enviar Datos";
        form.appendChild(submit);

        submit.addEventListener("click", () => {
            let valid = true;
            const values = inputElements.map(el => {
                if (!el.value.trim()) {
                    valid = false;
                    el.style.borderColor = "var(--widget-danger)";
                } else {
                    el.style.borderColor = "var(--widget-gray-300)";
                }
                return el.value.trim();
            });

            if (valid) {
                form.remove();
                onSubmit(values);
            }
        });

        chatBody.appendChild(form);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Ejecutar el flujo de conversación
    function runChatbotFlow() {
        widgetState.step = 1;
        const body = document.getElementById("widget-chat-body");
        if (body) body.innerHTML = "";

        appendBotMessage("¡Hola! Te doy la bienvenida al asistente inteligente de <strong>Clínica Dental Dobleese</strong>. 😊", () => {
            appendBotMessage("¿En qué tipo de tratamiento estás interesado/a para tu visita de valoración en Sevilla?", () => {
                renderOptions([
                    { label: "✨ Invisalign (Ortodoncia Invisible)", value: "invisalign" },
                    { label: "🦷 Implantes Dentales", value: "implantes" },
                    { label: "💎 Carillas o Estética Dental", value: "carillas" },
                    { label: "🧼 Blanqueamiento o Higiene", value: "limpieza" },
                    { label: "🩺 Revisión general / Dolor", value: "revision" }
                ], (val, label) => {
                    widgetState.currentLead.treatment = label;

                    // Asignar valor según COI
                    if (val === "invisalign") {
                        widgetState.currentLead.value = 3500;
                        widgetState.currentLead.isPrioritary = true;
                    } else if (val === "implantes") {
                        widgetState.currentLead.value = 3500;
                        widgetState.currentLead.isPrioritary = true;
                    } else if (val === "carillas") {
                        widgetState.currentLead.value = 2500;
                        widgetState.currentLead.isPrioritary = true;
                    } else if (val === "limpieza") {
                        widgetState.currentLead.value = 100;
                        widgetState.currentLead.isPrioritary = false;
                    } else {
                        widgetState.currentLead.value = 100;
                        widgetState.currentLead.isPrioritary = false;
                    }

                    if (widgetState.currentLead.isPrioritary) {
                        goToPrequalifyBranch();
                    } else {
                        goToLocationBranch();
                    }
                });
            });
        });
    }

    function goToPrequalifyBranch() {
        appendBotMessage("¡Excelente! Dobleese cuenta con tecnología avanzada 3D y microscopios de magnificación para darte la mayor precisión.", () => {
            appendBotMessage("¿Cuentas con radiografía o presupuesto previo, o partes de cero?", () => {
                renderOptions([
                    { label: "Parto de cero (necesito diagnóstico)", value: "cero" },
                    { label: "Busco una segunda opinión", value: "segunda" }
                ], () => {
                    appendBotMessage("Perfecto. Te recordamos que disponemos de planes de financiación flexibles de hasta 60 meses. ¿Te interesaría recibir información sobre los pagos en cuotas?", () => {
                        renderOptions([
                            { label: "Sí, me interesa financiación", value: "si_finan" },
                            { label: "No, prefiero pago directo", value: "no_finan" }
                        ], () => {
                            goToLocationBranch();
                        });
                    });
                });
            });
        });
    }

    function goToLocationBranch() {
        appendBotMessage("¿A qué clínica de Dobleese prefieres acudir para tu diagnóstico gratuito?", () => {
            renderOptions([
                { label: "Sevilla (Triana)", value: "Sevilla - Triana" },
                { label: "Dos Hermanas", value: "Dos Hermanas" }
            ], (val, label) => {
                widgetState.currentLead.location = label;
                goToContactDetailsBranch();
            });
        });
    }

    function goToContactDetailsBranch() {
        appendBotMessage("Estupendo. Para formalizar tu pre-reserva de cita, por favor indícame tu nombre completo:", () => {
            renderForm([
                { type: "text", placeholder: "Nombre y apellidos" }
            ], (vals) => {
                widgetState.currentLead.name = vals[0];
                appendUserMessage(vals[0]);

                appendBotMessage(`Gracias, ${widgetState.currentLead.name}. Indícanos tu teléfono de contacto para asignarte tu cita por llamada:`, () => {
                    renderForm([
                        { type: "tel", placeholder: "Teléfono de contacto" }
                    ], (vals) => {
                        widgetState.currentLead.phone = vals[0];
                        appendUserMessage(vals[0]);

                        appendBotMessage("Y finalmente, un correo electrónico para enviarte las instrucciones de tu primera visita:", () => {
                            renderForm([
                                { type: "email", placeholder: "Correo electrónico" }
                            ], (vals) => {
                                widgetState.currentLead.email = vals[0];
                                appendUserMessage(vals[0]);
                                goToTimePreferenceBranch();
                            });
                        });
                    });
                });
            });
        });
    }

    // Horarios de llamada
    function goToTimePreferenceBranch() {
        appendBotMessage("¿En qué horario te viene mejor recibir nuestra llamada de recepción?", () => {
            renderOptions([
                { label: "🌅 Por la mañana (9h a 14h)", value: "Por la mañana" },
                { label: "🌇 Por la tarde (14h a 21h)", value: "Por la tarde" },
                { label: "⚡ Lo antes posible / Sin preferencia", value: "Sin preferencia" }
            ], (val, label) => {
                widgetState.currentLead.timePref = label;
                finalizeReservation();
            });
        });
    }

    // Finalizar y guardar en localStorage para que el CRM lea
    function finalizeReservation() {
        widgetState.currentLead.id = "lead_" + Date.now();
        widgetState.currentLead.date = "Ahora mismo";

        const newLead = { ...widgetState.currentLead };

        // Guardar lead
        let currentLeads = [];
        try {
            const saved = localStorage.getItem("dobleese_leads");
            if (saved) currentLeads = JSON.parse(saved);
        } catch (e) {
            console.error(e);
        }
        currentLeads.push(newLead);
        localStorage.setItem("dobleese_leads", JSON.stringify(currentLeads));

        // Calcular y guardar estadísticas para actualizar la demo
        let revenue = 0;
        currentLeads.forEach(l => { revenue += l.value; });
        const stats = {
            revenue,
            leadsCount: currentLeads.length,
            hoursSaved: currentLeads.length * 1.5
        };
        localStorage.setItem("dobleese_stats", JSON.stringify(stats));

        // Lanzar evento storage para que la pestaña del CRM reaccione en tiempo real
        window.dispatchEvent(new Event('storage'));

        // Mensaje final
        appendBotMessage(`¡Estupendo, <strong>${newLead.name}</strong>! Hemos enviado tus detalles a la clínica.`, () => {
            appendBotMessage(`Un coordinador de citas de <strong>${newLead.location}</strong> te llamará en el horario de <strong>${newLead.timePref}</strong> al número <strong>${newLead.phone}</strong> para formalizar tu cita.`, () => {
                appendBotMessage("¡Gracias por confiar en Dobleese! Nos vemos pronto. 👋");

                // Resetear estado del bot
                widgetState.step = 0;
                widgetState.currentLead = {
                    name: "",
                    phone: "",
                    email: "",
                    treatment: "",
                    value: 100,
                    location: "",
                    timePref: "",
                    isPrioritary: false,
                    date: "Ahora",
                    status: "Pendiente"
                };
            });
        });
    }
})();
