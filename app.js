// Simulation variables
let gasPPM = 35;
let isLeakActive = false;
let isBuzzerActive = false;
let baseInterval;

// Voice Alert System Variables
let voiceEnabled = false;
let synthesis = window.speechSynthesis;
let audioContext;
let microphone;
let analyser;
let stream;
let listenInterval;

const ppmDisplay = document.getElementById('ppm-display');
const gaugeCircle = document.getElementById('gauge-circle');
const statusText = document.getElementById('status-text');
const statusDot = document.getElementById('status-dot');
const notifList = document.getElementById('notif-list');

// Initialize base ambient fluctuation
function startAmbient() {
    baseInterval = setInterval(() => {
        if (!isLeakActive) {
            // Fluctuate between 30 and 45 ppm
            gasPPM = Math.floor(Math.random() * 15) + 30;
            updateUI();
        }
    }, 2000);
}

startAmbient();

// Auto-request notification permission on page load
window.addEventListener('load', function () {
    if ('Notification' in window && Notification.permission === 'default') {
        // Try to request permission automatically
        Notification.requestPermission().then(function (permission) {
            if (permission === 'granted') {
                const phoneStatus = document.getElementById('phone-status');
                if (phoneStatus) {
                    phoneStatus.innerHTML = '<span style="color: #22c55e;">✓ Auto-enabled</span>';
                }
            }
        }).catch(function (err) {
            console.log('Auto permission request:', err);
        });
    }
});

// Enable phone notifications
function enablePhoneAlerts() {
    const btn = document.getElementById('enable-alerts-btn');
    const phoneStatus = document.getElementById('phone-status');

    if ('Notification' in window) {
        if (Notification.permission === 'granted') {
            phoneStatus.innerHTML = '<span style="color: #22c55e;">✓ Enabled</span>';
            btn.innerHTML = '✅ Phone Alerts Enabled';
            btn.style.background = '#22c55e';
            addNotification('info', 'Phone notifications enabled!');
        } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    phoneStatus.innerHTML = '<span style="color: #22c55e;">✓ Enabled</span>';
                    btn.innerHTML = '✅ Phone Alerts Enabled';
                    btn.style.background = '#22c55e';
                    addNotification('info', 'Phone notifications enabled!');
                } else {
                    alert('Please allow notifications to receive gas leak alerts on your phone!');
                }
            });
        } else {
            alert('Notifications blocked! Please enable them in browser settings.');
        }
    } else {
        alert('Your browser does not support notifications.');
    }
}

// Auto trigger gas leak - sets PPM to ~300 and notifies phone
function triggerAutoGasLeak() {
    if (isLeakActive) return;

    // Check and request notification permission
    if ('Notification' in window) {
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(function (permission) {
                if (permission === 'granted') {
                    startGasLeakSequence();
                } else {
                    alert('Please ALLOW notifications to receive gas leak alerts on your phone!');
                }
            });
        } else if (Notification.permission === 'denied') {
            alert('Notifications are BLOCKED. Please enable them in Chrome settings: Chrome → Settings → Privacy → Notifications');
            return;
        } else {
            startGasLeakSequence();
        }
    } else {
        alert('Your browser does not support notifications. Please use Chrome or a modern browser.');
    }
}

function startGasLeakSequence() {
    isLeakActive = true;

    // Smoothly animate PPM to ~300
    gasPPM = 0;
    const targetPPM = 280 + Math.floor(Math.random() * 40); // 280-320 range

    const ppmInterval = setInterval(() => {
        gasPPM += 15;
        if (gasPPM >= targetPPM) {
            gasPPM = targetPPM;
            clearInterval(ppmInterval);

            // Trigger buzzer and phone notification
            triggerBuzzerWithAlert();
        }
        updateUI();
    }, 30);
}

// Trigger buzzer and send phone notification
function triggerBuzzerWithAlert() {
    isBuzzerActive = true;

    statusText.innerText = "ALARM ACTIVE!";
    statusDot.className = "status-dot red pulse alert-anim";

    // Add danger class for smooth pulsing animation
    gaugeCircle.classList.add('danger');

    // Add dashboard notification
    addNotification('danger', '⚠️ HIGH GAS LEVEL DETECTED!');
    addNotification('alert', '🔔 Buzzer activated!');

    // Send alert to phone automatically
    sendAlertToPhone();

    // Vibrate
    if (navigator.vibrate) navigator.vibrate([300, 100, 300]);
}

function updateUI() {
    ppmDisplay.innerText = gasPPM;

    // Gauge styling based on PPM
    if (gasPPM < 200) {
        gaugeCircle.style.borderColor = 'var(--accent-3)'; // Green
        gaugeCircle.style.boxShadow = '0 0 30px rgba(16, 185, 129, 0.2)';
        if (!isBuzzerActive) {
            statusText.innerText = "System Normal";
            statusDot.className = "status-dot green";
        }
    } else if (gasPPM >= 200 && gasPPM < 500) {
        gaugeCircle.style.borderColor = 'var(--warning)'; // Yellow
        gaugeCircle.style.boxShadow = '0 0 30px rgba(245, 158, 11, 0.3)';
        statusText.innerText = "Warning: Elevated Gas";
        statusDot.className = "status-dot yellow";
    } else {
        gaugeCircle.style.borderColor = 'var(--danger)'; // Red
        gaugeCircle.style.boxShadow = '0 0 40px rgba(239, 68, 68, 0.4)';
        statusText.innerText = "DANGER: HIGH LEAK";
        statusDot.className = "status-dot red pulse";
    }
}

function addNotification(type, message) {
    const li = document.createElement('li');
    li.className = `notif ${type}`;

    // Add current time
    const now = new Date();
    const timeString = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

    li.innerHTML = `<span class="time">[${timeString}]</span> ${message}`;

    // Insert at top
    notifList.insertBefore(li, notifList.firstChild);

    // Keep only last 4
    if (notifList.children.length > 4) {
        notifList.removeChild(notifList.lastChild);
    }
}

// Button actions
function simGasLeak() {
    if (isLeakActive) return;
    isLeakActive = true;

    // Rapidly increase PPM to dangerous levels
    let dangerInterval = setInterval(() => {
        gasPPM += Math.floor(Math.random() * 80) + 40;
        updateUI();

        if (gasPPM > 600) {
            clearInterval(dangerInterval);
            addNotification('danger', 'MQ-2 detected critical LPG levels!');

            // Auto trigger buzzer after gas leak
            setTimeout(() => {
                simBuzzer(true);
            }, 1000);
        }
    }, 300);
}

function simBuzzer(isAutoTriggered = false) {
    if (isBuzzerActive) return;
    isBuzzerActive = true;

    statusText.innerText = "ALARM ACTIVE!";
    statusDot.className = "status-dot red pulse alert-anim";

    // Add acoustic notification
    const msg = isAutoTriggered
        ? 'LM393 Sound Sensor verified physical buzzer alarm!'
        : 'LM393 Sound Sensor detected loud manual buzzer input!';

    addNotification('alert', msg);

    // AUTOMATICALLY send notification to phone when buzzer sounds
    sendAlertToPhone();

    // Vibrate phone if on real device
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
}

// Send gas leak alert to phone automatically
function sendAlertToPhone() {
    const phoneStatus = document.getElementById('phone-status');

    // Update phone status
    if (phoneStatus) {
        phoneStatus.innerHTML = '<span style="color: #ef4444;">⚠️ ALERT SENT!</span>';
        phoneStatus.style.fontWeight = 'bold';
    }

    // Show push notification on phone
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 GAS LEAK DETECTED!', {
            body: 'DANGER! Evacuate immediately. Call Emergency: 1906',
            icon: '⚠️',
            tag: 'gas-leak',
            requireInteraction: true
        });
    }

    // Play alarm sound on phone
    playPhoneAlarm();

    // Vibrate phone
    if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 1000]);
    }

    // Speak the alert
    speakText('Warning! Gas leak detected! Evacuate immediately!');

    // Show notification on dashboard
    addNotification('danger', '📱 Gas leak notification sent to PHONE!');
}

function resetSim() {
    isLeakActive = false;
    isBuzzerActive = false;
    gasPPM = 35;

    // Remove danger class
    gaugeCircle.classList.remove('danger');

    updateUI();
    addNotification('info', 'System reset manually.');
}

// Voice Alert System Functions
async function toggleVoice() {
    const toggle = document.getElementById('voice-toggle');
    const statusEl = document.getElementById('voice-status');
    const emergencyNumbers = document.getElementById('emergency-numbers');
    const voiceIndicator = document.getElementById('voice-indicator');

    voiceEnabled = toggle.checked;

    if (voiceEnabled) {
        statusEl.innerText = 'Voice Alerts: ON';
        statusEl.style.color = '#e83e8c';
        emergencyNumbers.style.display = 'block';
        voiceIndicator.style.display = 'block';
        addNotification('info', 'Microphone enabled: Listening for buzzer...');

        try {
            // Request raw microphone access (disable browser noise suppression which filters out buzzers)
            stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                },
                video: false
            });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            microphone = audioContext.createMediaStreamSource(stream);

            microphone.connect(analyser);
            analyser.fftSize = 256;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // Listen loop
            listenInterval = setInterval(() => {
                analyser.getByteFrequencyData(dataArray);

                // Calculate max volume (peak frequency), peak bin, and average spectrum volume
                let maxVolume = 0;
                let peakBin = 0;
                let totalSum = 0;

                for (let i = 0; i < bufferLength; i++) {
                    totalSum += dataArray[i];
                    if (dataArray[i] > maxVolume) {
                        maxVolume = dataArray[i];
                        peakBin = i;
                    }
                }

                let avgVolume = totalSum / bufferLength;

                // Animate listening indicator based on volume
                const listeningSpan = document.querySelector('.listening');
                if (listeningSpan) {
                    listeningSpan.style.opacity = 0.5 + (maxVolume / 500);
                }

                // Update diagnostic UI
                const debugVol = document.getElementById('debug-vol');
                const debugBin = document.getElementById('debug-bin');
                const debugAvg = document.getElementById('debug-avg');
                if (debugVol) {
                    debugVol.innerText = `Peak Vol: ${maxVolume}`;
                    debugBin.innerText = `Peak Bin: ${peakBin} (Approx ${peakBin * (audioContext.sampleRate / 2 / bufferLength)}Hz)`;
                    debugAvg.innerText = `Avg Vol: ${Math.round(avgVolume)}`;
                }

                // Strict Pure-Tone Piezo Detection:
                // Temporarily lowered volume threshold to 120 and ratio to 1.5 to see if it triggers at all.
                if (maxVolume > 120 && peakBin >= 5 && maxVolume > (avgVolume * 1.5) && !isBuzzerActive) {
                    console.log("PURE TONE BUZZER DETECTED! Peak:", maxVolume, " | Bin:", peakBin, " | Avg:", avgVolume);
                    simBuzzer(true);      // trigger the UI buzzer
                    triggerVoiceAlert();  // trigger the speech

                    // Add a cooldown so it doesn't spam
                    clearInterval(listenInterval);
                    setTimeout(() => {
                        if (voiceEnabled && isLeakActive === false) {
                            toggleVoice(); // Restart listener by toggling off and on
                            toggle.checked = true;
                            toggleVoice();
                        }
                    }, 10000); // 10s cooldown
                }
            }, 100);

        } catch (err) {
            console.error("Microphone access denied or error:", err);
            addNotification('danger', 'Microphone access denied. Cannot listen for buzzer.');
            toggle.checked = false;
            voiceEnabled = false;
            statusEl.innerText = 'Voice Alerts: ERROR';
        }

    } else {
        statusEl.innerText = 'Voice Alerts: OFF';
        statusEl.style.color = 'var(--text-secondary)';
        emergencyNumbers.style.display = 'none';
        voiceIndicator.style.display = 'none';

        // Stop listening
        if (listenInterval) clearInterval(listenInterval);
        if (stream) stream.getTracks().forEach(track => track.stop());
        if (audioContext) audioContext.close();
    }
}

function speakText(text) {
    if (synthesis) {
        synthesis.cancel(); // Cancel any ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.1; // Slightly faster for emergency
        utterance.pitch = 1.2;
        utterance.volume = 1;

        // Select a female voice if available to sound like an alarm system
        const voices = synthesis.getVoices();
        const alarmVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Google UK English Female') || v.name.includes('Zira'));
        if (alarmVoice) utterance.voice = alarmVoice;

        synthesis.speak(utterance);
    }
}

function triggerVoiceAlert() {
    // Show alert notification
    addNotification('danger', '⚠️ GAS LEAKED! EVACUATE IMMEDIATELY!');

    // Speak emergency message
    speakText('Emergency! Emergency! Gas leak detected in the facility. Please evacuate immediately and call emergency services.');

    // Show emergency numbers in notification
    setTimeout(() => {
        addNotification('alert', '📞 Fire Department: 101 | Police: 100 | Ambulance: 102 | Gas Emergency: 1906');
    }, 2000);
}

// ==========================================
// Mobile USB Connection Detection System
// ==========================================

let usbDevice = null;
let usbConnected = false;

// Function to request USB device connection
async function requestUSBDevice() {
    const statusEl = document.getElementById('mobile-status');
    const btn = document.getElementById('request-usb');

    // Request notification permission first
    if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
    }

    try {
        // Request a USB device - this will open the browser's device selection dialog
        // For mobile detection, we look for devices that match common mobile phone vendor IDs
        const devices = await navigator.usb.getDevices();

        if (devices.length > 0) {
            // Device already connected
            handleDeviceConnected(devices[0]);
        } else {
            // Request new device - filters for common mobile phone vendors (Google, Samsung, Apple, etc.)
            const device = await navigator.usb.requestDevice({
                filters: [
                    { vendorId: 0x18d1 },  // Google
                    { vendorId: 0x04e8 },  // Samsung
                    { vendorId: 0x05ac },  // Apple
                    { vendorId: 0x0bb4 },  // HTC
                    { vendorId: 0x1004 },  // LG
                    { vendorId: 0x0fce },  // Sony
                    { vendorId: 0x12D1 },  // Huawei
                    { vendorId: 0x1782 },  // Xiaomi
                    { vendorId: 0x2c7c },  // Qualcomm
                    { vendorId: 0x2207 },  // Motorola
                ]
            });

            if (device) {
                handleDeviceConnected(device);
            }
        }
    } catch (err) {
        console.error('USB Connection Error:', err);
        if (err.name !== 'NotFoundError') {
            addNotification('danger', 'USB connection error: ' + err.message);
        }
    }
}

function handleDeviceConnected(device) {
    usbDevice = device;
    usbConnected = true;

    const statusEl = document.getElementById('mobile-status');
    const btn = document.getElementById('request-usb');

    // Update UI to show connected
    statusEl.innerHTML = '<span style="color: #22c55e;">✓ Connected</span>';
    statusEl.style.fontWeight = 'bold';
    btn.innerHTML = '🔌 Mobile Connected!';
    btn.style.background = '#22c55e';

    // Show the critical gas leak notification
    showMobileGasLeakAlert();
}

// Send push notification to PHONE
function sendPushNotificationToPhone(title, body) {
    // Check if Notifications are supported and permitted
    if ('Notification' in window && Notification.permission === 'granted') {
        // Create and show notification on the PHONE
        const notification = new Notification(title, {
            body: body,
            icon: '⚠️',
            badge: '⚠️',
            vibrate: [300, 150, 300, 150, 500],
            tag: 'gas-leak',
            requireInteraction: true,
            renotify: true,
            silent: false
        });

        notification.onclick = function () {
            window.focus();
            this.close();
        };

        return true;
    } else if ('Notification' in window && Notification.permission === 'default') {
        // Request permission first
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                sendPushNotificationToPhone(title, body);
            }
        });
    }
    return false;
}

// Play loud alarm sound on phone
function playPhoneAlarm() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        // Create alarm beep
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);

        // Alarm pattern
        oscillator.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 0.25);
        oscillator.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 0.5);
        oscillator.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 0.75);
        oscillator.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 1.0);

        gainNode.gain.setValueAtTime(0.8, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1.2);

        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + 1.2);
    } catch (err) {
        console.log('Audio error:', err);
    }
}

function showMobileGasLeakAlert() {
    // Send push notification directly to the phone
    const notificationSent = sendPushNotificationToPhone(
        '🚨 GAS LEAK DETECTED!',
        'Danger! Evacuate immediately. Call emergency: 1906'
    );

    // Play alarm sound on phone
    playPhoneAlarm();

    // Speak the alert using text-to-speech
    speakText('Warning! Gas leak detected. Evacuate immediately. Call emergency services.');

    // Vibrate the phone
    if (navigator.vibrate) {
        navigator.vibrate([300, 150, 300, 150, 500]);
    }

    // Add critical gas leak notification to dashboard
    addNotification('danger', '⚠️ MOBILE CONNECTED: GAS LEAK DETECTED!');
    addNotification('alert', '📱 Push notification sent to YOUR PHONE!');
    addNotification('alert', '🔔 Alarm sounding on phone!');

    // Additional notifications for emphasis
    setTimeout(() => {
        addNotification('danger', '🔥 EVACUATE IMMEDIATELY!');
    }, 1500);

    setTimeout(() => {
        addNotification('alert', '📞 Emergency: 1906 | Fire: 101');
    }, 3000);

    // Update status
    statusText.innerText = "MOBILE ALERT ACTIVE";
    statusDot.className = "status-dot red pulse alert-anim";

    // Change gauge to danger state
    gaugeCircle.style.borderColor = 'var(--danger)';
    gaugeCircle.style.boxShadow = '0 0 50px rgba(239, 68, 68, 0.6)';
}

// SIMPLE: Click button to send gas alert to phone
function triggerPhoneGasAlert() {
    const btn = document.getElementById('send-phone-alert');

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                sendGasAlertToPhone(btn);
            } else {
                alert('Please allow notifications to receive gas leak alerts!');
            }
        });
    } else if (Notification.permission === 'granted') {
        sendGasAlertToPhone(btn);
    } else if (Notification.permission === 'denied') {
        alert('Notifications are blocked. Please enable them in browser settings!');
    }
}

function sendGasAlertToPhone(btn) {
    // Play loud alarm sound
    playPhoneAlarm();

    // Vibrate phone
    if (navigator.vibrate) {
        navigator.vibrate([500, 200, 500, 200, 1000]);
    }

    // Show push notification
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🚨 GAS LEAK DETECTED!', {
            body: 'DANGER! Evacuate immediately. Call Emergency: 1906',
            icon: '⚠️',
            tag: 'gas-leak-alert',
            requireInteraction: true,
            silent: false
        });
    }

    // Speak the alert
    speakText('Warning! Gas leak detected! Evacuate immediately!');

    // Update UI
    addNotification('danger', '🚨 GAS LEAK ALERT SENT TO PHONE!');
    addNotification('danger', '🔥 EVACUATE IMMEDIATELY!');

    statusText.innerText = "PHONE ALERT ACTIVE";
    statusDot.className = "status-dot red pulse alert-anim";

    if (btn) {
        btn.innerHTML = '✅ Alert Sent!';
        btn.style.background = '#22c55e';

        setTimeout(() => {
            btn.innerHTML = '🚨 SEND GAS LEAK ALERT TO PHONE';
            btn.style.background = '#ef4444';
        }, 5000);
    }
}

// Listen for USB device disconnection
if (navigator.usb) {
    navigator.usb.addEventListener('disconnect', (event) => {
        const statusEl = document.getElementById('mobile-status');
        const btn = document.getElementById('request-usb');

        statusEl.innerHTML = '<span style="color: #666;">Disconnected</span>';
        statusEl.style.fontWeight = 'normal';
        btn.innerHTML = '🔌 Connect Mobile via USB';
        btn.style.background = '#6366f1';

        addNotification('info', 'Mobile device disconnected from system.');

        usbDevice = null;
        usbConnected = false;
    });
}

// Auto-detect if mobile is already connected on page load
window.addEventListener('load', async () => {
    if (navigator.usb) {
        try {
            const devices = await navigator.usb.getDevices();
            const mobileDevices = devices.filter(d =>
                [0x18d1, 0x04e8, 0x05ac, 0x0bb4, 0x1004, 0x0fce, 0x12D1, 0x1782, 0x2c7c, 0x2207].includes(d.vendorId)
            );

            if (mobileDevices.length > 0) {
                handleDeviceConnected(mobileDevices[0]);
            }
        } catch (err) {
            console.log('Initial USB check:', err.message);
        }
    }
});
