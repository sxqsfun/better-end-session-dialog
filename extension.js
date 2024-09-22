'use strict';

const { Clutter, GLib } = imports.gi;

const EndSessionDialog = imports.ui.endSessionDialog.EndSessionDialog;
const Main = imports.ui.main;
const SystemActions = imports.misc.systemActions;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const { Preferences } = Extension.imports.lib.preferences;
const { _ } = Extension.imports.lib.utils;

class ExtensionImpl {
    static {
        ExtensionUtils.initTranslations(Extension.uuid);
    }

    enable() {
        this._preferences = new Preferences();

        const extension = this;

        this._originUpdateButtonsFunc = EndSessionDialog.prototype._updateButtons;
        EndSessionDialog.prototype._updateButtons = function () {
            this.clearButtons();

            const systemActions = SystemActions.getDefault();

            const addButton = (buttonInfo) => {
                const button = this.addButton(buttonInfo);
                if (buttonInfo.setKeyFocus) {
                    this.setInitialKeyFocus(button);
                }
                return button;
            };

            addButton({
                label: _(`Cancel`),
                key: Clutter.KEY_Escape,
                action: this.cancel.bind(this),
            });

            if (extension._preferences.showSuspendButton && systemActions.canSuspend) {
                addButton({
                    label: _(`Suspend`, `button`),
                    action: () => {
                        const signalId = this.connect(`closed`, () => {
                            this.disconnect(signalId);
                            systemActions.activateSuspend();
                        });
                        this.cancel();
                    },
                });
            }

            if (Main.sessionMode.currentMode === `user` || Main.sessionMode.parentMode === `user`) {
                addButton({
                    label: _(`Log Out`, `button`),
                    setKeyFocus: this._type === 0,
                    action: () => {
                        const signalId = this.connect(`closed`, () => {
                            this.disconnect(signalId);
                            this._confirm(`ConfirmedLogout`);
                        });
                        this.close(true);
                    },
                });
            }

            const rebootAndInstall = this._pkOfflineProxy && (this._updateInfo.UpdateTriggered || this._updateInfo.UpgradeTriggered);
            this._rebootButton = addButton({
                label: rebootAndInstall ? _(`Restart &amp; Install`, `button`) : _(`Restart`, `button`),
                setKeyFocus: this._type >= 2 && this._type <= 4,
                action: () => {
                    const signalId = this.connect(`closed`, () => {
                        this.disconnect(signalId);
                        this._confirm(`ConfirmedReboot`);
                    });
                    this.close(true);
                },
            });

            if (this._canRebootToBootLoaderMenu) {
                this._rebootButtonAlt = addButton({
                    label: _(`Boot Options`, `button`),
                    action: () => {
                        const signalId = this.connect(`closed`, () => {
                            this.disconnect(signalId);
                            this._confirmRebootToBootLoaderMenu();
                        });
                        this.close(true);
                    },
                });
                this._rebootButtonAlt.visible = false;
                this._capturedEventId = this.connect(`captured-event`, this._onCapturedEvent.bind(this));
            }

            addButton({
                label: _(`Power Off`, `button`),
                setKeyFocus: this._type === 1,
                action: () => {
                    const signalId = this.connect(`closed`, () => {
                        this.disconnect(signalId);
                        this._confirm(`ConfirmedShutdown`);
                    });
                    this.close(true);
                },
            });
        };
    }

    disable() {
        EndSessionDialog.prototype._updateButtons = this._originUpdateButtonsFunc;
        delete this._originUpdateButtonsFunc;

        this._preferences.destroy();
        delete this._preferences;
    }
}

var init = () => {
    return new ExtensionImpl();
};
