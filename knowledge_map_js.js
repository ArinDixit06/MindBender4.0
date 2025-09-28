document.addEventListener("DOMContentLoaded", () => {
    const subjectSelect = document.getElementById("subject-select");
    const chapterSelect = document.getElementById("chapter-select");
    const flowchartContainer = document.getElementById("flowchart");
    const topicView = document.getElementById("topic-view");
    const topicContent = document.getElementById("topic-content");
    const closeBtn = document.getElementById("close-btn");

    // --- Event Listeners ---
    subjectSelect.addEventListener("change", handleSubjectChange);
    chapterSelect.addEventListener("change", handleChapterChange);
    flowchartContainer.addEventListener("click", handleTopicClick);
    closeBtn.addEventListener("click", () => topicView.style.display = "none");
    window.addEventListener("click", (event) => {
        if (event.target === topicView) {
            topicView.style.display = "none";
        }
    });

    // --- Handlers ---
    function handleSubjectChange() {
        const selectedSubject = subjectSelect.value;
        resetChapterSelect();
        hideFlowchart();

        if (selectedSubject === "Maths") {
            // Hardcoded class 10 for now as per the server logic
            fetchChapters(selectedSubject, "10");
        }
    }

    function handleChapterChange() {
        const selectedChapter = chapterSelect.value;
        if (selectedChapter) {
            fetchTopics("Maths", "10", selectedChapter);
        } else {
            hideFlowchart();
        }
    }

    function handleTopicClick(event) {
        const node = event.target.closest('.topic-node');
        if (node) {
            const topic = node.dataset.topic;
            const chapter = node.dataset.chapter;
            fetchAndDisplayTopicContent(topic, chapter);
        }
    }

    // --- API Fetching Functions ---
    async function fetchChapters(subject, studentClass) {
        try {
            const response = await fetch(`https://mindbender4-0.onrender.com/api/knowledge-map/chapters?subject=${subject}&class=${studentClass}`);
            if (!response.ok) throw new Error("Network response was not ok");
            const chapters = await response.json();
            populateChaptersDropdown(chapters);
        } catch (error) {
            console.error("Failed to fetch chapters:", error);
            alert("Could not load chapters. Please check the server and try again.");
        }
    }

    async function fetchTopics(subject, studentClass, chapter) {
        flowchartContainer.innerHTML = `<p>Loading topics for ${chapter}...</p>`;
        flowchartContainer.style.display = 'block';
        try {
            const response = await fetch(`https://mindbender4-0.onrender.com/api/knowledge-map/topics?subject=${subject}&class=${studentClass}&chapter=${encodeURIComponent(chapter)}`);
            if (!response.ok) throw new Error("Network response was not ok");
            const topics = await response.json();
            renderFlowchart(topics, chapter);
        } catch (error) {
            console.error("Failed to fetch topics:", error);
            flowchartContainer.innerHTML = `<p>Could not load topics. Please try again later.</p>`;
        }
    }

    async function fetchAndDisplayTopicContent(topic, chapter) {
        topicView.style.display = "flex";
        topicContent.innerHTML = "<h3>Loading explanation...</h3><p>Your AI tutor is preparing the content, please wait.</p>";
        
        try {
            const response = await fetch('https://mindbender4-0.onrender.com/api/knowledge-map/teach-topic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ topic, chapter })
            });

            if (!response.ok) throw new Error(`Server responded with ${response.status}`);
            
            const data = await response.json();
            topicContent.innerHTML = simpleMarkdownToHtml(data.content);

        } catch (error) {
            console.error("Failed to fetch topic content:", error);
            topicContent.innerHTML = "<h3>Oops!</h3><p>There was an error getting the explanation. Please close this and try again.</p>";
        }
    }

    // --- DOM Manipulation Functions ---
    function populateChaptersDropdown(chapters) {
        chapterSelect.innerHTML = '<option value="">-- Select a Chapter --</option>';
        chapters.forEach(chapter => {
            const option = document.createElement('option');
            option.value = chapter;
            option.textContent = chapter;
            chapterSelect.appendChild(option);
        });
        chapterSelect.disabled = false;
    }

    function renderFlowchart(topics, chapter) {
        flowchartContainer.innerHTML = "";
        if (topics.length === 0) {
            flowchartContainer.innerHTML = "<p>No topics found for this chapter.</p>";
            return;
        }

        topics.forEach(topic => {
            const node = document.createElement('div');
            node.className = 'topic-node';
            node.dataset.topic = topic.name;
            node.dataset.chapter = chapter;

            node.innerHTML = `
                <h3>${topic.name}</h3>
                <p>${topic.description}</p>
            `;
            flowchartContainer.appendChild(node);
        });
        flowchartContainer.style.display = 'block';
    }
    
    function resetChapterSelect() {
        chapterSelect.innerHTML = '<option value="">-- Select a subject first --</option>';
        chapterSelect.disabled = true;
    }

    function hideFlowchart() {
        flowchartContainer.style.display = 'none';
        flowchartContainer.innerHTML = "";
    }

    // --- Utility Functions ---
    function simpleMarkdownToHtml(md) {
        let html = md;
        // ### Headers to <h3>
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        // **Bold** to <strong>
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
         // Numbered list items
        html = html.replace(/^\s*\d+\.\s+(.*)/gm, '<li>$1</li>');
        // Unordered list items
        html = html.replace(/^\s*[\-\*]\s+(.*)/gm, '<li>$1</li>');
        // Wrap adjacent list items in <ol> or <ul>
        html = html.replace(/(<li>.*<\/li>\s*)+/g, (match) => {
            if (match.startsWith('<li>')) { // Simple check if it's a list item
                 return match.includes('1.') ? `<ol>${match}</ol>` : `<ul>${match}</ul>`;
            }
            return match;
        });
        // Replace newlines with <br> tags
        return html.replace(/\n/g, '<br>');
    }
});
