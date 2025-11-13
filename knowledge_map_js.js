document.addEventListener("DOMContentLoaded", async () => {
    const subjectSelect = document.getElementById("subject-select");
    const flowchartContainer = document.getElementById("flowchart");
    const topicView = document.getElementById("topic-view");
    const topicContent = document.getElementById("topic-content");
    const closeBtn = document.getElementById("close-btn");

    let currentTopics = [];
    let currentSubject = '';

    // --- Initialize: Load subjects on page load ---
    await loadSubjects();

    // --- Event Listeners ---
    subjectSelect.addEventListener("change", handleSubjectChange);
    flowchartContainer.addEventListener("click", handleTopicClick);
    closeBtn.addEventListener("click", () => {
        topicView.style.display = "none";
    });
    window.addEventListener("click", (event) => {
        if (event.target === topicView) {
            topicView.style.display = "none";
        }
    });

    // --- Handlers ---
    async function handleSubjectChange() {
        const selectedSubject = subjectSelect.value;
        currentSubject = selectedSubject;
        hideFlowchart();

        if (selectedSubject) {
            await fetchTopics(selectedSubject);
        }
    }

    function handleTopicClick(event) {
        const node = event.target.closest('.topic-node');
        if (node) {
            const topicId = node.dataset.topicId;
            const topic = currentTopics.find(t => t.map_id === topicId);
            if (topic) {
                fetchAndDisplayTopicContent(topic);
            }
        }
    }

    // --- API Fetching Functions ---
    async function loadSubjects() {
        try {
            const response = await fetch('/api/curriculum', {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            
            const { curriculums } = await response.json();
            populateSubjectsDropdown(curriculums);
        } catch (error) {
            console.error("Failed to fetch subjects:", error);
            subjectSelect.innerHTML = '<option value="">Error loading subjects</option>';
        }
    }

    async function fetchTopics(subjectName) {
        flowchartContainer.innerHTML = `<div class="loading-state"><p>Loading topics for ${subjectName}...</p></div>`;
        flowchartContainer.style.display = 'block';
        
        try {
            const response = await fetch(`/api/knowledge-map/topics?subject_name=${encodeURIComponent(subjectName)}`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error("Network response was not ok");
            }
            
            const topics = await response.json();
            currentTopics = topics;
            renderFlowchart(topics);
        } catch (error) {
            console.error("Failed to fetch topics:", error);
            flowchartContainer.innerHTML = `<div class="error-state"><p>Could not load topics. Please try again later.</p></div>`;
        }
    }

    async function fetchAndDisplayTopicContent(topic) {
        topicView.style.display = "flex";
        topicContent.innerHTML = `
            <div class="loading-message">
                <h3>Loading explanation...</h3>
                <p>Your AI tutor is preparing the content, please wait.</p>
            </div>
        `;
        
        try {
            const response = await fetch('/api/knowledge-map/teach-topic', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ 
                    topic: topic.topic_name,
                    subject: currentSubject,
                    description: topic.description,
                    difficulty_level: topic.difficulty_level
                })
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            
            const data = await response.json();
            topicContent.innerHTML = `
                <div class="topic-header">
                    <h2>${topic.topic_name}</h2>
                    ${topic.description ? `<p class="topic-description">${topic.description}</p>` : ''}
                    ${topic.difficulty_level ? `<span class="difficulty-badge">${topic.difficulty_level}</span>` : ''}
                </div>
                <div class="topic-explanation">
                    ${simpleMarkdownToHtml(data.content)}
                </div>
            `;

        } catch (error) {
            console.error("Failed to fetch topic content:", error);
            topicContent.innerHTML = `
                <div class="error-message">
                    <h3>Oops!</h3>
                    <p>There was an error getting the explanation. Please close this and try again.</p>
                </div>
            `;
        }
    }

    // --- DOM Manipulation Functions ---
    function populateSubjectsDropdown(curriculums) {
        subjectSelect.innerHTML = '<option value="">-- Select a Subject --</option>';
        curriculums.forEach(curriculum => {
            const option = document.createElement('option');
            option.value = curriculum.subject_name;
            option.textContent = curriculum.subject_name;
            subjectSelect.appendChild(option);
        });
    }

    function renderFlowchart(topics) {
        flowchartContainer.innerHTML = "";
        
        if (topics.length === 0) {
            flowchartContainer.innerHTML = "<div class='empty-state'><p>No topics found for this subject.</p></div>";
            return;
        }

        // Build a graph to understand prerequisite relationships
        const topicMap = new Map();
        topics.forEach(topic => {
            topicMap.set(topic.map_id, {
                ...topic,
                children: [],
                level: -1
            });
        });

        // Build parent-child relationships and find root nodes (no prerequisites)
        const rootNodes = [];
        topics.forEach(topic => {
            if (topic.prerequisite_topic_id) {
                const parent = topicMap.get(topic.prerequisite_topic_id);
                if (parent) {
                    parent.children.push(topic.map_id);
                }
            } else {
                rootNodes.push(topic.map_id);
            }
        });

        // Assign levels using BFS (Breadth-First Search)
        function assignLevels() {
            if (rootNodes.length === 0) {
                // If no root nodes, all topics have prerequisites - find cycles or assign manually
                topicMap.forEach((topic, id) => {
                    if (topic.level === -1) {
                        topic.level = 0; // Default level
                    }
                });
                return;
            }

            const queue = [...rootNodes];
            const visited = new Set();
            let currentLevel = 0;

            while (queue.length > 0) {
                const levelSize = queue.length;
                for (let i = 0; i < levelSize; i++) {
                    const nodeId = queue.shift();
                    if (visited.has(nodeId)) continue;
                    visited.add(nodeId);
                    
                    const node = topicMap.get(nodeId);
                    if (node) {
                        node.level = currentLevel;

                        node.children.forEach(childId => {
                            if (!visited.has(childId)) {
                                queue.push(childId);
                            }
                        });
                    }
                }
                currentLevel++;
            }

            // Handle any unvisited nodes (orphaned or cyclic dependencies)
            topicMap.forEach((topic, id) => {
                if (topic.level === -1) {
                    topic.level = currentLevel; // Place them at the end
                }
            });
        }

        assignLevels();

        // Group topics by level
        const topicsByLevel = new Map();
        topicMap.forEach((topic, id) => {
            const level = topic.level;
            if (!topicsByLevel.has(level)) {
                topicsByLevel.set(level, []);
            }
            topicsByLevel.get(level).push(topic);
        });

        // Render topics by level (left to right)
        const maxLevel = Math.max(...Array.from(topicsByLevel.keys()));
        
        // Create a container for the flowchart with SVG overlay for arrows
        const flowchartDiv = document.createElement('div');
        flowchartDiv.className = 'flowchart-wrapper';
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.classList.add('flowchart-svg');
        flowchartDiv.appendChild(svg);

        // Render each level
        for (let level = 0; level <= maxLevel; level++) {
            if (!topicsByLevel.has(level)) continue;
            
            const levelContainer = document.createElement('div');
            levelContainer.className = 'flowchart-level';
            levelContainer.dataset.level = level;

            topicsByLevel.get(level).forEach(topic => {
                const node = createTopicNode(topic);
                levelContainer.appendChild(node);
            });

            flowchartDiv.appendChild(levelContainer);
        }

        flowchartContainer.appendChild(flowchartDiv);

        // Draw arrows between prerequisites after a short delay to ensure DOM is ready
        setTimeout(() => {
            drawArrows(topicMap, flowchartDiv, svg);
        }, 100);
    }

    function createTopicNode(topic) {
        const node = document.createElement('div');
        node.className = 'topic-node';
        node.dataset.topicId = topic.map_id;
        
        let difficultyClass = '';
        if (topic.difficulty_level) {
            difficultyClass = `difficulty-${topic.difficulty_level.toLowerCase()}`;
        }

        node.innerHTML = `
            <h3>${topic.topic_name}</h3>
            ${topic.description ? `<p>${topic.description}</p>` : ''}
            ${topic.difficulty_level ? `<span class="difficulty-indicator ${difficultyClass}">${topic.difficulty_level}</span>` : ''}
        `;

        return node;
    }

    function drawArrows(topicMap, container, svg) {
        if (!svg) {
            svg = container.querySelector('.flowchart-svg');
            if (!svg) return;
        }

        // Clear existing arrows
        const existingArrows = svg.querySelectorAll('.arrow');
        existingArrows.forEach(arrow => arrow.remove());

        // Set SVG dimensions
        const containerRect = container.getBoundingClientRect();
        svg.setAttribute('width', containerRect.width);
        svg.setAttribute('height', containerRect.height);
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '1';

        // Draw arrows for prerequisites
        topicMap.forEach((topic, id) => {
            if (!topic.prerequisite_topic_id) return;

            const parentNode = container.querySelector(`[data-topic-id="${topic.prerequisite_topic_id}"]`);
            const childNode = container.querySelector(`[data-topic-id="${id}"]`);

            if (!parentNode || !childNode) return;

            const parentRect = parentNode.getBoundingClientRect();
            const childRect = childNode.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();

            const parentX = parentRect.left - containerRect.left + parentRect.width / 2;
            const parentY = parentRect.top - containerRect.top + parentRect.height;
            const childX = childRect.left - containerRect.left + childRect.width / 2;
            const childY = childRect.top - containerRect.top;

            // Draw arrow (from parent bottom to child top)
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            arrow.setAttribute('class', 'arrow');
            
            // Create a curved path for better visualization
            const midY = (parentY + childY) / 2;
            const path = `M ${parentX} ${parentY} Q ${parentX} ${midY} ${childX} ${childY}`;
            arrow.setAttribute('d', path);
            arrow.setAttribute('stroke', '#00AEEF');
            arrow.setAttribute('stroke-width', '3');
            arrow.setAttribute('fill', 'none');
            arrow.setAttribute('marker-end', 'url(#arrowhead)');
            arrow.setAttribute('opacity', '0.8');

            svg.appendChild(arrow);
        });

        // Add arrowhead marker if it doesn't exist
        if (!svg.querySelector('#arrowhead')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.setAttribute('id', 'arrowhead');
            marker.setAttribute('markerWidth', '10');
            marker.setAttribute('markerHeight', '10');
            marker.setAttribute('refX', '5');
            marker.setAttribute('refY', '3');
            marker.setAttribute('orient', 'auto');
            marker.setAttribute('viewBox', '0 0 10 6');

            const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            polygon.setAttribute('points', '0 0, 10 3, 0 6');
            polygon.setAttribute('fill', '#00AEEF');

            marker.appendChild(polygon);
            defs.appendChild(marker);
            svg.insertBefore(defs, svg.firstChild);
        }
    }

    function hideFlowchart() {
        flowchartContainer.style.display = 'none';
        flowchartContainer.innerHTML = "";
        currentTopics = [];
    }

    // --- Utility Functions ---
    function simpleMarkdownToHtml(md) {
        if (!md) return '';
        
        let html = md;
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        html = html.replace(/__(.*?)__/gim, '<strong>$1</strong>');
        
        // Italic
        html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
        html = html.replace(/_(.*?)_/gim, '<em>$1</em>');
        
        // Code
        html = html.replace(/`(.*?)`/gim, '<code>$1</code>');
        
        // Lists
        html = html.replace(/^\s*\d+\.\s+(.*)$/gm, '<li>$1</li>');
        html = html.replace(/^\s*[-*]\s+(.*)$/gm, '<li>$1</li>');
        
        // Wrap consecutive list items
        html = html.replace(/(<li>.*<\/li>\s*)+/g, (match) => {
            // Check if it's numbered by looking at first item
            const isNumbered = match.match(/^\s*<li>/);
            return isNumbered ? `<ol>${match}</ol>` : `<ul>${match}</ul>`;
        });
        
        // Paragraphs (double newlines)
        html = html.split(/\n\n+/).map(para => {
            para = para.trim();
            if (!para) return '';
            if (para.startsWith('<') && para.endsWith('>')) return para;
            return `<p>${para}</p>`;
        }).join('');
        
        // Single newlines to <br>
        html = html.replace(/\n/g, '<br>');
        
        return html;
    }
});
