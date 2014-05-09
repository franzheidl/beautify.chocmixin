/*
Beautify-Chocmixin.
A mixin for Chocolat to prettify-format Javascript, HTML and CSS.
https://github.com/franzheidl/run-applescript.chocmixin
Uses JSBeautify (https://github.com/einars/js-beautify) by Einar Lielmanis.
Franz Heidl 2014
MIT License
*/

var beautify = require('js-beautify');
var fs = require('fs');
var win;
var langs = ['JS', 'HTML', 'CSS'];

var DEFAULT_OPTIONS = { // TODO: make sure to save actual JS Beautify defaults on release!
  JS: {
    indent_size: 2,
    indent_char: ' ',
    indent_level: 0,
    indent_with_tabs: false,
    preserve_newlines: true,
    max_preserve_newlines: 10,
    jslint_happy: false,
    brace_style: 'expand',
    keep_array_indentation: false,
    keep_function_indentation: false,
    space_in_paren: true,
    break_chained_methods: false,
    eval_code: false,
    unescape_strings: false,
    wrap_line_length: 0
  },
  HTML: {
    indent_inner_html: false,
    indent_size: 4,
    indent_char: ' ',
    brace_style: 'collapse',
    indent_scripts: 'normal',
    wrap_line_length: 250,
    preserve_newlines: true,
    max_preserve_newlines: 10,
    unformatted: []
  },
  CSS: {
    indent_size: 2,
    indent_char: ' '
  }
};


/* Settings UI Map */
var OPTIONS_MAP = {
  JS: [
    {
      name: 'indent_size',
      label: 'Indentation size',
      type: 'number'
    },
    {
      name: 'indent_char',
      label: 'Indentation character',
      type: 'string',
      options: ['space', 'tab']
    },
    {
      name: 'indent_level',
      label: 'Indentation level',
      type: 'number'
    },
    {
      name: 'indent_with_tabs',
      label: 'Always use tabs for indentation',
      type: 'boolean',
      hint: 'Overrides Indentation Char setting'
    },
    {
      name: 'preserve_newlines',
      label: 'Preserve newlines',
      type: 'boolean'
    },
    {
      name: 'max_preserve_newlines',
      label: 'Max newlines to preserve in one chunk',
      type: 'number'
    },
    {
      name: 'jslint_happy',
      label: 'JSLint happy',
      type: 'boolean',
      hint: 'Stricter, JSLint-compliant formatting'
    },
    {
      name: 'brace_style',
      label: 'Brace style',
      type: 'string',
      options: ['collapse', 'expand', 'end-expand']
    },
    {
      name: 'keep_array_indentation',
      label: 'Keep array indentation',
      type: 'boolean'
    },
    {
      name: 'keep_function_indentation',
      label: 'Keep function indentation',
      type: 'boolean'
    },
    {
      name: 'space_in_paren',
      label: 'Insert padding spaces in parentheses',
      type: 'boolean'
    },
    {
      name: 'break_chained_methods',
      label: 'Break chained methods',
      type: 'boolean'
    },
    {
      name: 'eval_code',
      label: 'Evaluate code',
      type: 'boolean'
    },
    {
      name: 'unescape_strings',
      label: 'Unescape strings',
      type: 'boolean'
    },
    {
      name: 'wrap_line_length',
      label: 'Wrap lines after number of characters',
      type: 'number'
    }
  ],
  HTML: [
    {
      name: 'indent_size',
      label: 'Indentation size',
      type: 'number'
    },
    {
      name: 'indent_char',
      label: 'Indentation character',
      type: 'string',
      options: ['space', 'tab']
    },
    {
      name: 'indent_inner_html',
      label: 'Indent inner Html',
      type: 'boolean'
    },
    {
      name: 'brace_style',
      label: 'Brace style',
      type: 'string',
      options: ['collapse', 'expand', 'end-expand']
    },
    {
      name: 'indent_scripts',
      label: 'Indent scripts',
      type: 'string',
      options: ['normal', 'keep', 'separate']
    },
    {
      name: 'wrap_line_length',
      label: 'Wrap lines after number of characters',
      type: 'number'
    },
    {
      name: 'preserve_newlines',
      label: 'Preserve newlines',
      type: 'boolean'
    },
    {
      name: 'max_preserve_newlines',
      label: 'Max newlines to preserve in one chunk',
      type: 'number'
    },
    {
      name: 'unformatted',
      label: 'Dont‘t format tags',
      type: 'object',
      hint: 'Tags to be excluded from formatting, space- or comma-separated'
    }
  ],
  CSS: [
    {
      name: 'indent_size',
      label: 'Indentation size',
      type: 'number'
    },
    {
      name: 'indent_char',
      label: 'Indentation character',
      type: 'string',
      options: ['space', 'tab']
    }
  ]
};



function debug(b) {
  var tp = typeof b;
  if (typeof b === 'number') {
    b = b.toString();
  }
  else if (typeof b === 'object') {
    b = JSON.stringify(b);
  }
  Alert.show(tp, b);
}


/* Get Saved settings or return false */
function getSettings() {
  var s = Storage.persistent().get('BEAUTIFY_OPTIONS');
  if (!s) {
    return false;
  } else {
    return s;
  }
}


/* Get current user settings from window UI */
function getUserSettings() {
  win.applyFunction(function(data) {
    var allSettingsLists = document.querySelectorAll('.lang-settings');
    var userSettings = {};
    var curSettingsList,
        curLang,
        langMap,
        langSettings,
        curSettingsItems,
        curSettingItem,
        curInput,
        curMap,
        curSettingId,
        curSetting,
        curValue;
    
    /* Remove first (underscore-) prefix from string */
    var removePrefix = function(prefixedStr) {
      var str = prefixedStr.split('_');
      str.splice(0, 1);
      return str.join('_');
    };
    
    
    var getCurrentSettingMap = function(m, s) {
      var sm = false;
      if (Array.isArray(m)) {
        var l = m.length;
        while (l--) {
          if (m[l].name === s) {
            return m[l];
          }
        }
      }
      return sm;
    };


    for (var s = 0; s < allSettingsLists.length; s++) {
      curSettingsList = allSettingsLists[s];
      curLang = curSettingsList.getAttribute('id');
      langMap = data[curLang];
      langSettings = {};
      curSettingsItems = curSettingsList.querySelectorAll('li');


      /* Parse User Settings */
      for (var i = 0; i < curSettingsItems.length; i++) {
        curSettingItem = curSettingsItems[i];
        curInput = curSettingItem.querySelector('input');

        if (curInput) {
          curSettingId = curInput.getAttribute('id');
          curSetting = removePrefix(curSettingId);

          /* Input Elements */
          if (curInput.type === 'checkbox') {
            curValue = curInput.checked;
          } else if (curInput.type === 'text') {
            // curValue = curInput.value.split(',');
            curValue = curInput.value.split(/[ ,]+/);
            // TODO: strip whitespace, create array from space-separated list
          } else if (curInput.type === 'number') {
            curValue = Number(curInput.value);
          }

          /* Select Element */
        } else {
          curInput = curSettingItem.querySelector('select');
          if (curInput) {
            curSettingId = curInput.getAttribute('id');
            curSetting = removePrefix(curSettingId);
            curMap = getCurrentSettingMap(langMap, curSetting);

            if (curSetting === 'indent_char') {
              if (curMap.options[curInput.options.selectedIndex] === 'space') {
                curValue = ' ';
              } else if (curMap.options[curInput.options.selectedIndex] === 'tab') {
                curValue = '\t';
              }
            } else {
              curValue = curMap.options[curInput.options.selectedIndex];
            }

          }
        }
        langSettings[curSetting] = curValue;
      }
      userSettings[curLang] = langSettings;
    }
    chocolat.sendMessage('save', userSettings);

  }, [OPTIONS_MAP]);
}


/* Save the settings */
function saveSettings(s) {
  Storage.persistent().set('BEAUTIFY_OPTIONS', s);
}


/* Beautify Document or selection */
function run() {
  if (Document.current()) {
    Recipe.run(function(recipe) {
      var scope = Document.current().rootScope();

      if (scope === 'js.source' || scope === 'basic.html.text' || scope === 'css.source') {

        var selection, input, options, result;
        if (recipe.selection.length > 0) {
          selection = recipe.selection;
        } else {
          selection = new Range(0, recipe.length);
        }

        input = recipe.textInRange(selection);

        if (getSettings()) {
          options = getSettings();
        } else {
          options = DEFAULT_OPTIONS;
        }

        try {
          if (scope === 'js.source') {
            if (options.JS) {
              result = beautify(input, options.JS);
            }
          } else if (scope === 'basic.html.text') {
            if (options.HTML) {
              result = beautify.html(input, options.HTML);
            }
          } else if (scope === 'css.source') {
            if (options.CSS) {
              result = beautify.css(input, options.CSS);
            }
          }
        } catch (error) {
          Alert.show('Beautify Error: ', error);
        } finally {
          if (result) {
            recipe.replaceTextInRange(selection, result);
          }
        }
      } else {
        Alert.show('Beautify Error: ', Document.current().filename() + ' does not appear to be Javascript, HTML, or CSS');
      }
    });
  }
}


/* Build/Refresh the settings window */
function refreshSettings(lang) {
  if (!lang) { // default to JS if called without lang context
    lang = 'JS';
  }

  var options = getSettings();
  if (!options) {
    options = DEFAULT_OPTIONS;
  }


  var data = {
    lang: lang, // the language requested by UI/user
    options: options, // all language options
    map: OPTIONS_MAP, // the map of all options for all laguages
    langs: langs // all languages
  };

  win.applyFunction(function(data) {
    var lang = data.lang;
    var options = data.options;
    var map = data.map;
    var langs = data.langs;
    var langSwitch = document.getElementById('langswitch');
    var settingsDiv = document.getElementById('settings');

    langSwitch.options.selectedIndex = langs.indexOf(lang);
    settingsDiv.innerHTML = '';

    var prettyArrayString = function(a) {
      var s = '';
      if (typeof a === 'string') {
        if (a.indexOf('[') === 0) {
          s = a.substr(1);
        }
        if (a.indexOf(']', a.length -1)) {
          s = a.substr(0, a.length -1);
        }
      } else if (typeof a === 'object') {
        if (Array.isArray(a)) {
          for (var i = 0; i < a.length; i++) {
            if (i === 0) {
              s += a[i];
            } else {
              s += ', ' + a[i];
            }
          }
        }
      }
      return s;
    };

    var resizeWin = function() {
      window.resizeTo(window.innerWidth, document.getElementById('settings-container').getBoundingClientRect().height + 55);
    };
    
    window.onkeydown = function(e) {
      /* Close on Esc */
      var focused;
      if (e.keyCode === 27) {
        focused = document.querySelector('input:focus');
        if (focused) {
          return focused.blur();
        } else {
          e.preventDefault();
          return chocolat.sendMessage('close', []);
        }
      } else if (e.keyCode === 13) {
        e.preventDefault();
        return chocolat.sendMessage('saveFromWithin', []);
      }
    };

    window.switchLang = function(e) {
      var s = e.target;
      var cLang = langs[s.options.selectedIndex];
      var sttgs = document.querySelectorAll('.lang-settings');

      for (var n = 0; n < sttgs.length; n++) {
        if (sttgs[n].getAttribute('id') === cLang) {
          sttgs[n].classList.remove('hide');
        } else {
          sttgs[n].classList.add('hide');
        }
        resizeWin();
      }
    };

    var lgOptions,
        lgMap,
        lgUl,
        optionLi,
        option,
        optionLabelContainer,
        optionLabel,
        optionInput,
        optionInputOptions,
        optionInputOption,
        optionInputContainer,
        optionCheckboxContainer,
        optionHintContainer,
        optionHintContent,
        optionHintIcon,
        optionHint;


    for (var lg in map) {

      lgMap = map[lg]; // map of the current lang
      lgOptions = options[lg]; // options of the current lang

      lgUl = document.createElement('ul'); // create list for options of the current lang
      lgUl.setAttribute('id', lg);
      lgUl.classList.add('lang-settings');

      if (lg !== lang) { // hide lang options if not the options of the current lang
        lgUl.classList.add('hide');
      }

      // ceate individual options for lg:
      for (var o = 0; o < lgMap.length; o++) {
        option = lgMap[o];
        optionLi = document.createElement('li');
        optionLi.classList.add('option-item');
        optionLabel = document.createElement('label');
        optionLabel.textContent = option.label;
        optionLabel.setAttribute('for', lg + '_' + option.name);

        if (option.type === 'boolean') {
          optionLi.classList.add('option-item--checkbox');
          optionCheckboxContainer = document.createElement('div');
          optionCheckboxContainer.classList.add('option-checkbox-container');
          optionInput = document.createElement('input');
          optionInput.setAttribute('type', 'checkbox');
          optionInput.setAttribute('id', lg + '_' + option.name);
          if (lgOptions[option.name] === true) {
            optionInput.setAttribute('checked');
          }
          optionCheckboxContainer.appendChild(optionInput);
          optionCheckboxContainer.appendChild(optionLabel);
          optionLi.appendChild(optionCheckboxContainer);

        } else {
          optionLabelContainer = document.createElement('div');
          optionLabelContainer.classList.add('label-container');
          optionInputContainer = document.createElement('div');
          optionInputContainer.classList.add('input-container');

          if (option.type === 'number') {
            optionInput = document.createElement('input');
            optionInput.setAttribute('type', 'number');
            optionInput.setAttribute('id', lg + '_' + option.name);
            optionInput.setAttribute('min', '0');
            optionInput.value = lgOptions[option.name];
          }
          else if (option.type === 'string') {
            optionInput = document.createElement('select');
            optionInput.setAttribute('id', lg + '_' + option.name);
            optionInputOptions = option.options;
            for (var i = 0; i < optionInputOptions.length; i++) {
              optionInputOption = document.createElement('option');
              optionInputOption.textContent = optionInputOptions[i];
              optionInput.appendChild(optionInputOption);
            }

            // Map indentation characters (space or tab) to human readable words:
            if (option.name === 'indent_char') {

              if (lgOptions[option.name] === ' ') {
                optionInput.options.selectedIndex = option.options.indexOf('space');
              } else if (lgOptions[option.name] === '\t') {
                optionInput.options.selectedIndex = option.options.indexOf('tab');
              }
            } else {
              optionInput.options.selectedIndex = option.options.indexOf(lgOptions[option.name]);
            }

          }
          else if (option.type === 'object') {
            optionInput = document.createElement('input');
            optionInput.setAttribute('type', 'text');
            optionInput.setAttribute('id', lg + '_' + option.name);
            optionInput.value = prettyArrayString(lgOptions[option.name]);
          }

          optionLabelContainer.appendChild(optionLabel);
          optionInputContainer.appendChild(optionInput);
          optionLi.appendChild(optionLabelContainer);
          optionLi.appendChild(optionInputContainer);

        }

        /* Hints */
        if (option.hint) {
          optionHintContainer = document.createElement('span');
          optionHintContainer.classList.add('option-hint-container');
          optionHintIcon = document.createElement('span');
          optionHintIcon.classList.add('option-hint-icon');
          optionHintIcon.textContent = '?';
          optionHint = document.createElement('span');
          optionHint.classList.add('option-hint');
          optionHintContent = document.createElement('p');
          optionHintContent.textContent = option.hint;
          optionHint.appendChild(optionHintContent);
          optionHintContainer.appendChild(optionHintIcon);
          optionHintContainer.appendChild(optionHint);
          optionLi.appendChild(optionHintContainer);
        }

        lgUl.appendChild(optionLi);
      }
      settingsDiv.appendChild(lgUl);
    }

    resizeWin();

  }, [data]);

}


/* Get the language currently selected in settings window */
function currentUserLang() {
  var langs = ['JS', 'HTML', 'CSS'];
  var curLgIndex = win.evalExpr('document.getElementById("langswitch").options.selectedIndex');
  return langs[curLgIndex];
}


/* Restore settings window ui settings to defaults */
function restoreDefaults() {
  saveSettings(DEFAULT_OPTIONS);
  refreshSettings(currentUserLang());
}


/* Show the settings window */
function showSettings() {
  var lang = 'JS'; // default lang to show

  if (Document.current()) { // get the current docs lang and show acc settings if applicable
    var doc = Document.current();
    if (doc.rootScope() === 'basic.html.text') {
      lang = 'HTML';
    } else if (doc.rootScope() === 'css.source') {
      lang = 'CSS';
    }
  }

  /* Show Settings Window */

  if (!win || win === 'undefined') {
    win = new Window();
    win.htmlPath = './html/beautifysettings.html';
    win.title = 'Beautify Settings';
    win.buttons = ['Save', 'Cancel', 'Defaults'];

    win.onLoad = function() {
      refreshSettings(lang);
    };

    win.onUnload = function() {
      win = undefined;
    };

    win.onButtonClick = function(button) {
      if (button === 'Cancel') {
        win.close();
      } else if (button === 'Save') {
        getUserSettings();
      } else if (button === 'Defaults') {
        restoreDefaults();
      }
    };

    win.onMessage = function(message) {
      var arg = '';
      if (arguments) {
        arg = arguments['1'];
      }
      if (message === 'debug') {
        debug(arg);
      }
      else if (message === 'save') {
        saveSettings(arg);
        win.close();
      }
      else if (message === 'saveFromWithin') {
        var userSettings = getUserSettings();
        saveSettings(userSettings);
        win.close();
      }
      else if (message === 'close') {
        win.close();
      }
    };

    win.run();
  } else {
    win.show();
  }

}


Hooks.addMenuItem( 'Actions/Beautify/Beautify JS, HTML or CSS', 'alt-ctrl-cmd-j', function() {
  run();
});

Hooks.addMenuItem( 'Actions/Beautify/Beautify Settings...', '', function() {
  showSettings();
});

Hooks.addMenuItem( 'Actions/Beautify/Debug Settings', '', function() {
  Alert.show(JSON.stringify(getSettings()));
});
