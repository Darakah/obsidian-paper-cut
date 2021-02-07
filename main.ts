import { App, Modal, Notice, Plugin, PluginSettingTab, Setting, FrontMatterCache, CachedMetadata } from 'obsidian';

interface PapercutSettings {
	PAPER_CUT_TAG: string;
	PAPER_CUT_LIMIT: number;
	APPLY_TO_ALL: boolean;
}

const DEFAULT_SETTINGS: PapercutSettings = {
	PAPER_CUT_TAG: 'papercut',
	PAPER_CUT_LIMIT: 5000,
	APPLY_TO_ALL: false
}

export default class PapercutPlugin extends Plugin {
	settings: PapercutSettings;
    fill_perc: number;
    page_len: number;
    page_cache: CachedMetadata;
    page_content: string;
    statusBar: HTMLElement;

    super(){
        fill_perc: this.fill_perc;
        page_len: this.page_len;
        page_cache: this.page_cache;
        page_content: this.page_content;
        statusBar: this.statusBar;
    }

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
        this.statusBar = this.addStatusBarItem();
       	this.addSettingTab(new PapercutSettingTab(this.app, this));

        // Run cut function on load
        this.cut();
	}

	cut(){
		// Only work if the current Active file is an md note
         if(this.app.workspace.getActiveFile()) {
            // Only proceed if current page has a paper cut tab
            this.page_cache = this.app.metadataCache.getFileCache(this.app.workspace.getActiveFile());

            if(this.settings.APPLY_TO_ALL || this.page_cache){
                if(this.settings.APPLY_TO_ALL || this.page_cache.frontmatter.tags.includes(this.settings.PAPER_CUT_TAG)){
                 this.app.vault.adapter.read(this.app.workspace.getActiveFile().path).then((value) => { this.page_content = value;
                 this.page_len = this.page_content.replace(/[^a-zA-Z0-9]/g, '').length;});
                // Check the number of characters on the current active page
                this.fill_perc = (this.page_len / this.settings.PAPER_CUT_LIMIT) * 100

                let mid, lhs, rhs, tmp_content;
                tmp_content = "";

                if(this.page_len > this.settings.PAPER_CUT_LIMIT){
                    this.statusBar.setText('100 %');
                    // get the illegal text
                    lhs = this.settings.PAPER_CUT_LIMIT;
                    rhs = this.page_content.length;

                    while ((tmp_content.replace(/[^a-zA-Z0-9]/g, '').length < this.settings.PAPER_CUT_LIMIT) && (lhs < rhs)) {
                        mid = lhs + (rhs - lhs) / 2;
                        let tmp = tmp_content + this.page_content.substring(tmp_content.length, mid);
                        if (tmp.replace(/[^a-zA-Z0-9]/g, '').length < this.settings.PAPER_CUT_LIMIT) {
                            lhs = mid + 1;
                            tmp_content = tmp_content + this.page_content.substring(tmp_content.length, mid);
                        }
                        else {
                            rhs = mid - 1;
                        }
                    }

                    this.app.vault.adapter.write(this.app.workspace.getActiveFile().path, this.page_content.substring(0, mid))

                } else {
                    this.statusBar.setText(Math.round(this.fill_perc * 100) / 100 + " %")
                    //console.log('limit not reached');
                }
            } else {
                this.statusBar.setText('');
                //console.log('Not a tagged file!');
            }
            } else {
                this.statusBar.setText('');
                //console.log('No frontmatter!');
            }
            }else {
                this.statusBar.setText('');
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

class PapercutSettingTab extends PluginSettingTab {
	plugin: PapercutPlugin;

	constructor(app: App, plugin: PapercutPlugin) {
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
                    await this.plugin.saveSettings();
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
                    await this.plugin.saveSettings();
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
