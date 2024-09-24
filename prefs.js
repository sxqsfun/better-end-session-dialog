'use strict';

const { Adw, GObject, Gtk } = imports.gi;

const ExtensionUtils = imports.misc.extensionUtils;
const Extension = ExtensionUtils.getCurrentExtension();
const { Preferences } = Extension.imports.lib.preferences;
const { _ } = Extension.imports.lib.utils;

var init = () => {
    ExtensionUtils.initTranslations(Extension.uuid);
};

var fillPreferencesWindow = (window) => {
    window._preferences = new Preferences();
    window.connect(`close-request`, () => {
        window._preferences.destroy();
    });

    const suspendButtonSwitch = new Gtk.Switch({
        valign: Gtk.Align.CENTER,
    });
    window._preferences.bind_property(
        `showSuspendButton`,
        suspendButtonSwitch,
        `active`,
        GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE
    );

    const suspendButtonRow = new Adw.ActionRow({
        activatable_widget: suspendButtonSwitch,
        title: _(`Show suspend button`),
    });
    suspendButtonRow.add_suffix(suspendButtonSwitch);

    const hibernateButtonSwitch = new Gtk.Switch({
        valign: Gtk.Align.CENTER,
    });
    window._preferences.bind_property(
        `showHibernateButton`,
        hibernateButtonSwitch,
        `active`,
        GObject.BindingFlags.BIDIRECTIONAL | GObject.BindingFlags.SYNC_CREATE
    );

    const hibernateButtonRow = new Adw.ActionRow({
        activatable_widget: hibernateButtonSwitch,
        title: _(`Show hibernate button`),
    });
    hibernateButtonRow.add_suffix(hibernateButtonSwitch);

    const generalGroup = new Adw.PreferencesGroup({
        title: _(`General`, `General options`),
    });
    generalGroup.add(suspendButtonRow);
    generalGroup.add(hibernateButtonRow);

    const page = new Adw.PreferencesPage();
    page.add(generalGroup);

    window.add(page);
};
