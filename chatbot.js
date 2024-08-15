let conversationStage = 'initial'; // Tracks the conversation stage
let initialMessageSent = false; // Flag to check if initial message has been sent

// Function to toggle chatbot visibility
// Function to toggle chatbot visibility
function toggleChatbot() {
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotIcon = document.getElementById('chatbot-icon');
    const chatbotTooltip = document.getElementById('chatbot-tooltip');
    const currentDisplay = getComputedStyle(chatbotWindow).display;

    if (currentDisplay === 'none' || currentDisplay === '') {
        chatbotWindow.style.display = 'flex'; // Use flex to maintain layout
        chatbotWindow.scrollTop = chatbotWindow.scrollHeight; // Scroll to the bottom when opened
        chatbotIcon.style.display = 'none'; // Hide the chatbot icon
        chatbotTooltip.style.display = 'none'; // Hide the tooltip

        if (!initialMessageSent) {
            sendInitialMessage(); // Send initial message only if not sent before
        }
    } else {
        chatbotWindow.style.display = 'none';
        chatbotIcon.style.display = ''; // Show the chatbot icon
        chatbotTooltip.style.display = 'block'; // Show the tooltip
    }
}


function sendInitialMessage() {
    const initialMessage = `Please select one of the following options:
        <div><input class="radio-chatbot" type="radio" name="options" onclick="handleOption('Explore Our Services')"> Explore Our Services</div>
        <div><input class="radio-chatbot" type="radio" name="options" onclick="handleOption('Looking for Career Opportunities')"> Looking for Career &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Opportunities</div>`;
    addMessageToChat('bot-bubble', initialMessage);
    conversationStage = 'options';
    initialMessageSent = true; // Set flag to true after sending the initial message
}

function sendMessage() {
    const inputField = document.getElementById('chatbot-input');
    const message = inputField.value.trim();

    if (message) {
        addMessageToChat('user-bubble', message);
        inputField.value = '';

        let botReplyText = '';

        if (conversationStage === 'options') {
            if (message === 'Explore Our Services') {
                botReplyText = `Great! Could you please specify the service you're interested in?
                    <div><input class="radio-chatbot" type="radio" name="service" onclick="handleOption('Custom Software Development')"> Custom Software &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Development</div>
                    <div><input class="radio-chatbot" type="radio" name="service" onclick="handleOption('AI Development')"> AI Development</div>
                    <div><input class="radio-chatbot" type="radio" name="service" onclick="handleOption('VoIP Services')"> VoIP Services</div>
                    <div><input class="radio-chatbot" type="radio" name="service" onclick="handleOption('Project Management')"> Project Management</div>
                    <div><input class="radio-chatbot" type="radio" name="service" onclick="handleOption('IT Consulting')"> IT Consulting</div>`;
                conversationStage = 'serviceOptions';
            } else if (message === 'Looking for Career Opportunities') {
                botReplyText = `Fantastic! We’re always looking for talented individuals. Are you interested in a specific position or just exploring opportunities?
                    <div><input class="radio-chatbot" type="radio" name="career" onclick="handleOption('Yes, I’m interested in a specific position')"> Yes, I’m interested in a &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;specific position</div>
                    <div><input class="radio-chatbot" type="radio" name="career" onclick="handleOption('Just exploring')"> Just exploring</div>`;
                conversationStage = 'careerOptions';
            }
        } else if (conversationStage === 'serviceOptions') {
            botReplyText = `Could you please provide your contact details so our team can reach out to you?<br>
                <div><input class="radio-chatbot" type="radio" name="contactAction" onclick="handleOption('Cancel')"> Cancel(If you don't &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;wan't to send a &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;message)</div>`;
            conversationStage = 'contactDetails';
            enableInput(); // Enable input field for contact details
        } else if (conversationStage === 'contactDetails') {
            if (message === 'Cancel') {
                botReplyText = `Conversation has been canceled.`;
                conversationStage = 'end';
                disableInput(); // Disable input field after canceling
                setTimeout(sendInitialMessage, 2000); // Send initial message after a 2-second delay
            } else {
                botReplyText = `Thank you! Our team will get in touch with you as soon as possible.`;
                sendEmail(message); // Assuming the email is the message provided
                conversationStage = 'finalStage';
                disableInput(); // Disable input field after sending contact details
            }
        } else if (conversationStage === 'careerOptions') {
            botReplyText = `Please visit our <a href="careers.html" target="_blank">Careers page</a> to see the current openings and apply directly.`;
            botReplyText += `<br>Is there anything else you would like assistance with?
                <div><input class="radio-chatbot" type="radio" name="additionalHelp" onclick="handleOption('Yes')"> Yes</div>
                <div><input class="radio-chatbot" type="radio" name="additionalHelp" onclick="handleOption('No')"> No</div>`;
            conversationStage = 'finalStage';
        } else if (conversationStage === 'finalStage') {
            if (message.toLowerCase() === 'options') {
                sendInitialMessage(); // Resend initial message if 'options' is selected
            } else if (message === 'Yes') {
                botReplyText = `Please briefly describe your inquiry and provide your contact details. Our team will get back to you promptly.
                    <div><input class="radio-chatbot" type="radio" name="cancelOrProceed" onclick="handleOption('Cancel')">  Cancel(If you don't &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;wan't to send a &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;message)</div>`;
                conversationStage = 'describeInquiry';
                enableInput(); // Enable input field for description and contact details
            } else if (message === 'No') {
                botReplyText = `Thank you so much for your time. Have a great day!`;
                conversationStage = 'end';
                disableInput();
                setTimeout(sendInitialMessage, 2000); // Send initial message after a 2-second delay
            }
        } else if (conversationStage === 'describeInquiry') {
            if (message === 'Cancel') {
                botReplyText = `Conversation has been canceled.`;
                conversationStage = 'end';
                disableInput(); // Disable input field after canceling
                setTimeout(sendInitialMessage, 2000); // Send initial message after a 2-second delay
            } else {
                botReplyText = `Thank you for the message. We'll contact you soon.`;
                sendEmail(message); // Send the message and contact details
                conversationStage = 'end';
                disableInput();
                setTimeout(sendInitialMessage, 2000); // Send initial message after a 2-second delay
            }
        }

        addMessageToChat('bot-bubble', botReplyText);
    }
}

function enableInput() {
    document.getElementById('chatbot-input').disabled = false;
    document.getElementById('chatbot-send').disabled = false;
}

function disableInput() {
    document.getElementById('chatbot-input').disabled = true;
    document.getElementById('chatbot-send').disabled = true;
}

// Function to add a message to the chat
function addMessageToChat(className, message) {
    const chatbotBody = document.getElementById('chatbot-body');
    const botBubble = document.createElement('div');
    botBubble.classList.add('chat-bubble', className);
    
    if (className === 'bot-bubble') {
        botBubble.innerHTML = `<div class="loader"><div></div><div></div><div></div></div>`;
    } else {
        botBubble.innerHTML = message;
    }
    
    chatbotBody.appendChild(botBubble);
    
    if (className === 'bot-bubble') {
        setTimeout(() => {
            botBubble.innerHTML = message;
            chatbotBody.scrollTop = chatbotBody.scrollHeight;
        }, 1000); // 1-second delay for bot reply
    } else {
        chatbotBody.scrollTop = chatbotBody.scrollHeight;
    }
}

// Function to handle option selection and page navigation
function handleOption(option) {
    const inputField = document.getElementById('chatbot-input');
    inputField.value = option;
    sendMessage();
}

emailjs.init("qdNgirAK0VHPX-yQL"); // Replace with your EmailJS user ID

function sendEmail(message) {
    emailjs.send('service_sbuzg5c', 'template_ydj6iyt', {
        message: message
    }).then(response => {
        console.log('Email sent successfully:', response);
    }).catch(error => {
        console.error('Error sending email:', error);
    });
}
