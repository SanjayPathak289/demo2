let currentColor = "";
let currentFont = "";
let currentWebPage = "";
let allHighlights = [];
let contextualBox;

const injectSelectionStyles = () => {
    style = document.createElement('style');
    document.head.appendChild(style);
    style.textContent += `
        ::selection {
            background-color: ${currentColor};
        }`;
}

const fetchHighlights = () => {
    // return new Promise((resolve) => {
    //     chrome.storage.sync.get([currentWebPage], (res) => {
    //         resolve(res[currentWebPage] ? JSON.parse(res[currentWebPage]) : [])
    //     })
    // })
    allHighlights = [{
        "text": "Support reading klib contents in Analysis API",
        "color": "red",
        "startXPath": "/*[position()=1]/*[position()=2]/*[position()=1]/*[position()=8]/*[position()=1]/*[position()=1]/*[position()=2]/*[position()=1]/*[position()=1]/*[position()=1]/*[position()=1]/*[position()=1]/*[position()=1]/*[position()=2]/*[position()=2]/*[position()=4]/*[position()=1]/*[position()=2]/*[position()=1]/*[position()=1]/*[position()=2]/*[position()=1]/*[position()=1]/*[position()=2]/*[position()=4]/*[position()=1]",
        "rect": {
            "x": 486.4624938964844,
            "y": 378.32501220703125,
            "width": 276.4250183105469,
            "height": 18.399993896484375,
            "top": 378.32501220703125,
            "right": 762.8875122070312,
            "bottom": 396.7250061035156,
            "left": 486.4624938964844
        },
        "font": "",
        "date": "2024-06-03T11:27:58.663Z",
        "notes": [
            [
                "hello",
                "Mon Jun 03 2024"
            ],
            [
                "sanjay",
                "Mon Jun 03 2024"
            ]
        ]
    }]
    return allHighlights;
}
const addHighlight = async (info) => {
    allHighlights = await fetchHighlights();
    allHighlights.push(info);
    chrome.storage.sync.set({
        [currentWebPage]: JSON.stringify(allHighlights)
    })
}
function getXPathForElement(element) {
    var xpath = '';
    for (; element && element.nodeType == 1; element = element.parentNode) {
        var id = Array.from(element.parentNode.children).indexOf(element) + 1;
        xpath = '/*[position()=' + id + ']' + xpath;
    }
    return xpath;
}
function getElementByXPath(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}



const showNotes = () => {

}
document.addEventListener('selectionchange', () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
            document.execCommand("fontName", false, currentFont);
        }
    }
});
document.addEventListener("mouseup", () => {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (!range.collapsed) {
            const span = document.createElement('span');
            span.className = `highlight-${currentColor}`;
            span.style.position = "relative";
            span.style.fontFamily = currentFont;
            range.surroundContents(span);

            span.addEventListener("mouseover", () => showContextualBox(span, range.getBoundingClientRect()));
            span.addEventListener("mouseout", (event) => {
                if (!contextualBox.contains(event.relatedTarget)) {
                    contextualBox.style.display = "none";
                }
            });
            let startContainer = range.startContainer;

            var startXPath = getXPathForElement(startContainer.nodeType === 1 ? startContainer : startContainer.parentNode);
            var storedRange = {
                text: range.toString(),
                color: currentColor,
                startXPath: startXPath,
                rect: range.getBoundingClientRect(),
                font: currentFont,
                date: new Date()
            };
            addHighlight(storedRange);
            selection.removeAllRanges();
        }
    }
});

const makeContextualBox = () => {
    contextualBox = document.createElement("div");
    contextualBox.id = "hover-box";
    contextualBox.style.position = "absolute";
    contextualBox.style.border = '1px solid black';
    contextualBox.style.backgroundColor = 'yellow';
    contextualBox.style.padding = '5px';
    contextualBox.style.zIndex = '1000';
    contextualBox.style.display = 'none';
    contextualBox.style.minWidth = '300px';
    contextualBox.style.height = '300px';

    const tabDiv = document.createElement("div");
    tabDiv.id = "tabDiv";
    const addNoteBtn = document.createElement("button");
    addNoteBtn.id = "addNoteBtn";
    addNoteBtn.textContent = "+";
    addNoteBtn.style.cursor = "pointer";
    tabDiv.style.display = "flex";
    tabDiv.style.flexDirection = "row-reverse";
    tabDiv.appendChild(addNoteBtn);
    contextualBox.appendChild(tabDiv);

    addNoteBtn.addEventListener("click", () => {
        const note1 = document.createElement("button");
        note1.textContent = "note1";
        tabDiv.appendChild(note1);
        const notesDiv = document.getElementById("notesDiv");
        if (!notesDiv) {
            const notesDiv = document.createElement("textarea");
            notesDiv.id = "notesDiv";
            contextualBox.appendChild(notesDiv);
        }

    })

}
makeContextualBox();
const saveHandler = (rect) => {
    const notesDiv = document.getElementById("notesDiv");
    const noteValue = notesDiv.value;
    const obj = allHighlights.find(item => item["rect"] === rect);
    if (obj) {
        if (!Array.isArray(obj.notes)) {
            obj.notes = [];
        }
        obj.notes.push([noteValue, new Date()]);
        notesDiv.innerText = "";
        chrome.storage.sync.set({
            [currentWebPage]: JSON.stringify(allHighlights)
        })
        console.log("saved");
    }
    else {
        console.log("No object found");
    }
}
const showContextualBox = (span, rect, notes) => {
    if (contextualBox.style.display == "none") {
        let div = document.getElementById("hover-box");
        if (div) {
            div.parentNode.removeChild(div);
        }

        contextualBox.style.left = `${Math.abs(150 - rect.width / 2)}px`;
        contextualBox.style.bottom = `${rect.height}px`;

        span.appendChild(contextualBox);
        contextualBox.style.display = "block";

        if (notes && notes.length > 0) {
            const tabDiv = document.getElementById("tabDiv");
            tabDiv.innerHTML = "";
            const addNoteBtn = document.createElement("button");
            addNoteBtn.id = "addNoteBtn";
            addNoteBtn.textContent = "+";
            addNoteBtn.style.cursor = "pointer";
            addNoteBtn.addEventListener("click", () => {
                const note1 = document.createElement("button");
                note1.textContent = "note1";
                tabDiv.appendChild(note1);
                let notesDiv = document.getElementById("notesDiv");
                if (!notesDiv) {
                    notesDiv = document.createElement("textarea");
                    notesDiv.id = "notesDiv";
                    contextualBox.appendChild(notesDiv);
                }

            })
            tabDiv.appendChild(addNoteBtn);
            notes.forEach((note) => {
                const noteBtn = document.createElement("button");
                noteBtn.id = "noteBtn";
                noteBtn.textContent = `note${note[0]}`;
                noteBtn.style.cursor = "pointer";
                tabDiv.append(noteBtn);
                noteBtn.addEventListener("click", () => {
                    let notesDiv = document.getElementById("notesDiv");
                    if (!notesDiv) {
                        notesDiv = document.createElement("textarea");
                        notesDiv.id = "notesDiv";
                        contextualBox.appendChild(notesDiv);
                    }
                    notesDiv.innerText = note;
                });
            });
        }
        else {

        }
        let saveBtn = document.getElementById("saveBtn");
        if (!saveBtn) {
            saveBtn = document.createElement("button");
            saveBtn.id = "saveBtn";
            saveBtn.textContent = "Save";
            contextualBox.appendChild(saveBtn);
        }
        saveBtn.addEventListener("click", () => { saveHandler(rect) });
    }
}
function wrapTextInSpan(startNode, textToWrap, color, rect, notes) {
    let currentNode = startNode;

    // Function to recursively search and replace the text within the node and its children
    function recursiveWrap(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            let text = node.nodeValue;
            let index = text.indexOf(textToWrap);
            if (index !== -1) {
                // Split the text node at the start and end of the text to wrap
                let beforeText = text.slice(0, index);
                let afterText = text.slice(index + textToWrap.length);

                // Create a new span element
                let span = document.createElement('span');
                span.className = `highlight-${color}`;
                span.textContent = textToWrap;
                span.style.position = "relative";

                span.addEventListener("mouseover", () => showContextualBox(span, rect, notes));
                span.addEventListener("mouseout", (event) => {
                    if (!contextualBox.contains(event.relatedTarget) && !span.contains(event.relatedTarget)) {
                        const saveBtn = document.getElementById("saveBtn");
                        if (saveBtn) {
                            saveBtn.parentNode.removeChild(saveBtn);
                        }
                        contextualBox.style.display = "none";
                    }
                })
                contextualBox.addEventListener("mouseover", () => {
                    contextualBox.style.display = "block";
                });
                contextualBox.addEventListener("mouseout", (event) => {
                    if (!contextualBox.contains(event.relatedTarget) && !span.contains(event.relatedTarget)) {
                        const saveBtn = document.getElementById("saveBtn");
                        if (saveBtn) {
                            saveBtn.parentNode.removeChild(saveBtn);
                        }
                        contextualBox.style.display = "none";
                    }
                });

                // Create new text nodes for the before and after text
                let beforeNode = document.createTextNode(beforeText);
                let afterNode = document.createTextNode(afterText);

                // Replace the original text node with the new nodes
                let parent = node.parentNode;
                parent.insertBefore(beforeNode, node);
                parent.insertBefore(span, node);
                parent.insertBefore(afterNode, node);
                parent.removeChild(node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            for (let child of Array.from(node.childNodes)) {
                recursiveWrap(child);
            }
        }
    }

    recursiveWrap(currentNode);
}


const showHighlights = async () => {
    // allHighlights = await fetchHighlights();
    allHighlights = [{
        "text": "Support reading klib contents in Analysis API",
        "color": "red",
        "startXPath": "/*[position()=1]/*[position()=2]/*[position()=1]/*[position()=8]/*[position()=1]/*[position()=1]/*[position()=2]/*[position()=1]/*[position()=1]/*[position()=1]/*[position()=1]/*[position()=1]/*[position()=1]/*[position()=2]/*[position()=2]/*[position()=4]/*[position()=1]/*[position()=2]/*[position()=1]/*[position()=1]/*[position()=2]/*[position()=1]/*[position()=1]/*[position()=2]/*[position()=4]/*[position()=1]",
        "rect": {
            "x": 486.4624938964844,
            "y": 378.32501220703125,
            "width": 276.4250183105469,
            "height": 18.399993896484375,
            "top": 378.32501220703125,
            "right": 762.8875122070312,
            "bottom": 396.7250061035156,
            "left": 486.4624938964844
        },
        "font": "",
        "date": "2024-06-03T11:27:58.663Z",
        "notes": [
            [
                "hello",
                "Mon Jun 03 2024"
            ],
            [
                "sanjay",
                "Mon Jun 03 2024"
            ]
        ]
    }]
    console.log(allHighlights);
    allHighlights.forEach(element => {
        setTimeout(() => {
            var startNode = getElementByXPath(element.startXPath);
            wrapTextInSpan(startNode, element.text, element.color, element.rect, element.notes);
        }, 2000);
    });


}
const download = () => {
    let htmlContent = document.documentElement.outerHTML;

    const persistentScript = `<script src="https://cdn.jsdelivr.net/gh/SanjayPathak289/demo/demo.js"></script>`
    htmlContent = htmlContent.replace('</body>', persistentScript + '</body>');


    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'webpage.html';
    a.click();
    URL.revokeObjectURL(url);
}

injectSelectionStyles();
showHighlights();

// chrome.runtime.onMessage.addListener((request, sender, response) => {
//     if (request.action === "setColor") {
//         currentColor = request.color;
//         injectSelectionStyles();
//     }
//     else if (request.action == "setFont") {
//         currentFont = request.font;
//     }
//     else if (request.action == "NEW") {
//         currentWebPage = request.page;
//         showHighlights();
//     }
//     else if (request.action == "download") {
//         download();
//         console.log("object");
//     }
// });
