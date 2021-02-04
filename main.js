'use strict';

var obsidian = require('obsidian');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function writeme(){
        return 'asdcsadc';
    }

/***************** Define Custom Functions ****************************/
// Create element of specified type
function element(name, attr) {
    return document.createElement(name);}

// Append node to target
function append(target, node) {
    target.appendChild(node);}

// Insert node to target at specified anchor
function insert(target, node, anchor) {
    target.insertBefore(node, anchor || null);}

// Remove node from parent
function detach(node) {
    node.parentNode.removeChild(node);}

// Create text element
function text(data) {
    return document.createTextNode(data);}
// return space text
function space() {
    return text(' ');}

// return empty text
function empty() {
    return text('');}

// Set node attribute to value
function attr(node, attribute, value) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);}

// Return array of element's child nodes
function children(element) {
    return Array.from(element.childNodes);}

// Set text to data if it is different
function set_data(text, data) {
    data = '' + data;
    if (text.wholeText !== data)
        text.data = data;}

// Delay passed function for specified timeout
function debounce(func, wait, immediate) {
  var timeout;

  return function executedFunction() {
    var context = this;
    var args = arguments;
        
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };

    var callNow = immediate && !timeout;
    
    clearTimeout(timeout);

    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(context, args);
  };
};

const PAPER_CUT_TAG = 'papercut';
const PAPER_CUT_LIMIT = 5000;




/******************************************************************************/

var MyPlugin = /** @class */ (function (_super) {
    __extends(MyPlugin, _super);
    function MyPlugin() {
        return _super !== null && _super.apply(this, arguments) || this;
        // define handlers to monitor the current active leaf
        this.containerEl = this.containerEl;
    }
    MyPlugin.prototype.onInit = function () {

    };
    MyPlugin.prototype.onload = function () {

        var _this = this;
        // Send output to console
        console.log('Loaded Comments Plugin');
        // Run cut function on load

        this.cut = this.cut.bind(this);
        this.registerEvent(this.app.workspace.on("layout-ready", this.cut));
        this.registerEvent(this.app.workspace.on("file-open", this.cut));
        this.registerEvent(this.app.workspace.on("quick-preview", this.cut));
        this.registerEvent(this.app.vault.on("delete", this.cut));

        // Add status bar to update
        var status = this.addStatusBarItem();
        attr(status, 'class', 'papercut')

        this.cut();
        //this.app.Vault.write(this.app.workspace.getActiveFile().path, 'test me why not')
        //this.app.vault.adapter.write(this.app.workspace.getActiveFile().path, "try me now")
    };

     MyPlugin.prototype.cut = function () {

         // Only work if the current Active file is an md note
         if(this.app.workspace.getActiveFile() != undefined) {
            // Only proceed if current page has a paper cut tab
            var frontmatter = this.app.metadataCache.getFileCache(this.app.workspace.getActiveFile()).frontmatter;
            var content = this.app.workspace.getActiveFile().cachedData;
            var len = content.replace(/\s/g, '').length;


            if(frontmatter != undefined){
                if(frontmatter.tags.includes(PAPER_CUT_TAG)){
                // Check the number of characters on the current active page
                var perc = (len / PAPER_CUT_LIMIT) * 100

                let i;
                var tmp_content, tmp_counter;
                tmp_content = "";
                tmp_counter = PAPER_CUT_LIMIT;

                if(len > PAPER_CUT_LIMIT){
                    this.app.statusBar.containerEl.querySelector("div[class='papercut']").innerHTML = " 100 %"
                    // get the illegal text
                    for(i = PAPER_CUT_LIMIT; i < content.length; i++)
                    {
                        tmp_content = tmp_content + content.substring(tmp_content.length, i)
                        if(tmp_content.replace(/\s/g, '').length < PAPER_CUT_LIMIT){
                            tmp_counter++;
                        } else {
                            break;}
                    }
                    this.app.vault.adapter.write(this.app.workspace.getActiveFile().path, content.substring(0, tmp_counter))
                    //console.log(content.substring(0, tmp_counter))

                } else {
                    this.app.statusBar.containerEl.querySelector("div[class='papercut']").innerHTML = perc + " %"
                    //console.log('limit not reached');
                }
            } else {
                this.app.statusBar.containerEl.querySelector("div[class='papercut']").innerHTML = '';
                //console.log('Not a tagged file!');
            }
            } else {
                this.app.statusBar.containerEl.querySelector("div[class='papercut']").innerHTML = '';
                //console.log('No frontmatter!');
            }
            }else {
                this.app.statusBar.containerEl.querySelector("div[class='papercut']").innerHTML = '';
                //console.log('Not a note active file!')
            }
     }

    // Function to be run when plugin is unloaded
    MyPlugin.prototype.onunload = function () {
        console.log('unloading plugin');
    };
    return MyPlugin;
}(obsidian.Plugin));

module.exports = MyPlugin;
