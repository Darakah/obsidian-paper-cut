import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

interface MyPluginSettings {
	PAPER_CUT_TAG: string;
	PAPER_CUT_LIMIT: number;
	APPLY_TO_ALL: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	PAPER_CUT_TAG: 'papercut',
	PAPER_CUT_LIMIT: 5000,
	APPLY_TO_ALL: false
}

// Set node attribute to value
function attr(node: any, attribute: string, value: string) {
    if (value == null)
        node.removeAttribute(attribute);
    else if (node.getAttribute(attribute) !== value)
        node.setAttribute(attribute, value);}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
        // Send output to console
        console.log('Loaded Comments Plugin');

        await this.loadSettings();

        this.cut = this.cut.bind(this);
        this.registerEvent(this.app.workspace.on("layout-ready", this.cut));
        this.registerEvent(this.app.workspace.on("file-open", this.cut));
        this.registerEvent(this.app.workspace.on("quick-preview", this.cut));
        this.registerEvent(this.app.vault.on("delete", this.cut));

        // Add status bar to update
        var status = this.addStatusBarItem();
        attr(status, 'class', 'papercut')

       	this.addSettingTab(new SampleSettingTab(this.app, this));

        // Run cut function on load
        this.cut();
	}

	cut(){
		// Only work if the current Active file is an md note
         if(this.app.workspace.getActiveFile() != undefined) {
            // Only proceed if current page has a paper cut tab
            var frontmatter = this.app.metadataCache.getFileCache(this.app.workspace.getActiveFile()).frontmatter;
            var content = (this.app.workspace.getActiveFile() as any).cachedData;
            var len = content.replace(/[^a-zA-Z0-9]/g, '').length;

            if(this.settings.APPLY_TO_ALL || (frontmatter != undefined)){
                if(this.settings.APPLY_TO_ALL || frontmatter.tags.includes(this.settings.PAPER_CUT_TAG)){
                // Check the number of characters on the current active page
                var perc = (len / this.settings.PAPER_CUT_LIMIT) * 100

                let i, mid, lhs, rhs, tmp;
                var tmp_content, tmp_counter;
                tmp_content = "";
                tmp_counter = this.settings.PAPER_CUT_LIMIT;

                if(len > this.settings.PAPER_CUT_LIMIT){
                    (this.app as any).statusBar.containerEl.querySelector("div[class='papercut']").innerHTML = " 100 %";
                    // get the illegal text
                    lhs = this.settings.PAPER_CUT_LIMIT;
                    rhs = content.length;

                    while ((tmp_content.replace(/[^a-zA-Z0-9]/g, '').length < this.settings.PAPER_CUT_LIMIT) && (lhs < rhs)) {
                        mid = lhs + (rhs - lhs) / 2;
                        tmp = tmp_content + content.substring(tmp_content.length, mid);
                        if (tmp.replace(/[^a-zA-Z0-9]/g, '').length < this.settings.PAPER_CUT_LIMIT) {
                            lhs = mid + 1;
                            tmp_content = tmp_content + content.substring(tmp_content.length, mid);
                        }
                        else {
                            rhs = mid - 1;
                        }
                    }

                    this.app.vault.adapter.write(this.app.workspace.getActiveFile().path, content.substring(0, mid))
                    //console.log(content.substring(0, tmp_counter))

                } else {
                    (this.app as any).statusBar.containerEl.querySelector("div[class='papercut']").innerHTML = Math.round(perc * 100) / 100 + " %"
                    //console.log('limit not reached');
                }
            } else {
                (this.app as any).statusBar.containerEl.querySelector("div[class='papercut']").innerHTML = '';
                //console.log('Not a tagged file!');
            }
            } else {
                (this.app as any).statusBar.containerEl.querySelector("div[class='papercut']").innerHTML = '';
                //console.log('No frontmatter!');
            }
            }else {
                (this.app as any).statusBar.containerEl.querySelector("div[class='papercut']").innerHTML = '';
                //console.log('Not a note active file!')
            }
		return;
	}

	onunload() {
		console.log('unloading plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();
		containerEl.createEl('h2', {text: 'Settings for my awesome plugin.'});

		new Setting(containerEl)
			.setName('Paper Cut Tag')
			.setDesc('Tag to specify which notes to paper cut. e.g. papercut for #papercut tag')
			.addText(text => text
				.setPlaceholder(this.plugin.settings.PAPER_CUT_TAG)
				.setValue('')
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.PAPER_CUT_TAG = value;
				}));

		new Setting(containerEl)
			.setName('Paper Cut Limit')
			.setDesc('The maximum number of characters that a cut paper can hold. Does not include whitespaces and other non-informative characters!')
			.addText(text => text
				.setPlaceholder("" + this.plugin.settings.PAPER_CUT_LIMIT)
				.setValue('')
				.onChange(async (value) => {
					console.log('Secret: ' + value);
					this.plugin.settings.PAPER_CUT_LIMIT = +value;
				}));

		new Setting(containerEl)
			.setName('Paper Cut ALL !! DANGER !!')
			.setDesc('Applies Paper Cut to all notes by default (no tag specificity)')
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings.APPLY_TO_ALL);
				toggle.onChange(async (value) => {
					this.plugin.settings.APPLY_TO_ALL = value;
					await this.plugin.saveSettings();
				});
			});
	}
}
