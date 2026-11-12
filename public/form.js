
// Adjust a textarea height based on the content.
ocForm.updateHeight = function(area) {
  if (!area) return;

  if (!area.dataset.baseRows) {
    area.dataset.baseRows = area.getAttribute('rows') || '2';
  }

  const computedStyle = window.getComputedStyle(area);
  const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
  const minHeight = lineHeight * Number(area.dataset.baseRows);

  area.rows = area.value.split('\n').length;
  area.style.height = 'auto';
  area.style.height = `${Math.max(area.scrollHeight, minHeight)}px`;
};

// Return a valid suggestion items.
ocForm.validSuggestionItems = function(id) {
  const ulElement = document.getElementById("validSuggestions_" + id);
  return ulElement.querySelectorAll('li');
}

// Return an array of valid suggestion items.
ocForm.getValidSuggestions = function(id) {
  const ulElement = document.getElementById("validSuggestions_" + id);
  const listItems = ulElement.getElementsByTagName('li');
  return Array.from(listItems).map(li => li.textContent);
};

// Return a search input element.
ocForm.getSearchInput = function(id) {
  return document.getElementById(id);
};

// Return suggestions list element.
ocForm.getSuggestionsList = function(id) {
  return document.getElementById("suggestionsList_" + id);
};

// Return an add button element.
ocForm.getAddButton = function(id) {
  return document.getElementById("addButton_" + id);
};

// Return a selected items element.
ocForm.getSelectedItems = function(id) {
  return document.getElementById("selectedItems_" + id);
};

// Hide suggestions by clearing its content.
ocForm.hideSuggestions = function(id) {
  const suggestionsList = ocForm.getSuggestionsList(id);
  suggestionsList.innerHTML = '';
};

// Display suggestions based on the current search input.
ocForm.showSuggestions = function(id, showAll = false) {
  const searchInput = ocForm.getSearchInput(id);
  const suggestionsList = ocForm.getSuggestionsList(id);
  const validSuggestions = ocForm.getValidSuggestions(id);
  const query = searchInput.value.toLowerCase();
  suggestionsList.innerHTML = '';
  ocForm.updateAddButtonState(id);

  let i = 0;
  validSuggestions.forEach((suggestion) => {
    if (showAll || suggestion.toLowerCase().includes(query)) {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'list-group-item-action', 'z-3');
      li.textContent = suggestion;

      if (Object.values(ocForm.multiSelectDisabledIndexes).includes(i++)) {
        li.style.pointerEvents = 'none';
        li.style.opacity = '0.5';
        li.style.background = "black";
        li.style.color = "white";
      }

      // Event listeners for click, mousedown, mouseover, and mouseout events.
      li.addEventListener('click', () => {
        searchInput.value = suggestion;
        suggestionsList.innerHTML = '';
        ocForm.updateAddButtonState(id);
      });

      li.addEventListener('mousedown', () => {
        searchInput.value = suggestion;
        suggestionsList.innerHTML = '';
        ocForm.updateAddButtonState(id);
      });

      li.addEventListener('mouseover', () => {
        ocForm.clearActiveItems(id);
        li.classList.add('active');
      });

      li.addEventListener('mouseout', () => {
        li.classList.remove('active');
      });

      suggestionsList.appendChild(li);
    }
  });
};

// Handle keyboard navigation and selection in the suggestions list.
ocForm.handleKeyDown = function(event, id) {
  const suggestionsList = ocForm.getSuggestionsList(id);
  const items = suggestionsList.getElementsByClassName('list-group-item');
  let currentIndex = -1;

  Array.from(items).some((item, index) => {
    if (item.classList.contains('active')) {
      currentIndex = index;
      return true; // escape loop
    }
  });

  if (['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
    event.preventDefault();

    if (event.key === 'ArrowDown' && currentIndex < items.length - 1) {
      currentIndex++;
      ocForm.updateActiveItem(items, currentIndex, id);
    }
    else if (event.key === 'ArrowUp' && currentIndex > 0) {
      currentIndex--;
      ocForm.updateActiveItem(items, currentIndex, id);
    }
    else if (event.key === 'Enter') {
      const input = ocForm.getSearchInput(id);
      if (currentIndex >= 0) {
        input.value = items[currentIndex].textContent;
      }
      if (input.value.trim() !== "") {
        ocForm.addSelectedItem(id);
      }
      suggestionsList.innerHTML = '';
    }
  }
};

// Update the active item in the suggestions list.
ocForm.updateActiveItem = function(items, currentIndex, id) {
  ocForm.clearActiveItems(id);
  if (currentIndex >= 0) {
    items[currentIndex].classList.add('active');
  }
};

// Clear active items in the suggestions list.
ocForm.clearActiveItems = function(id) {
  const items = ocForm.getSuggestionsList(id).getElementsByClassName('list-group-item');
  Array.from(items).forEach(item => item.classList.remove('active'));
};

// Enable or disable an add button based on whether the input has a value.
ocForm.updateAddButtonState = function(id) {
  const searchInput = ocForm.getSearchInput(id).value.trim();
  const addButton = ocForm.getAddButton(id);

  addButton.disabled = searchInput === "";
};

// Update hidden values which are used in cache.
ocForm.updateHiddenValues = function(id) {
  const hiddenValues = document.getElementById("hiddenValues_" + id);
  const selectedItems = ocForm.getSelectedItems(id);
  const anchors = Array.from(selectedItems.getElementsByTagName('a'));

  hiddenValues.innerHTML = "";
  anchors.forEach((anchor, i) => {
    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = `${id}_${i+1}`;
    hiddenInput.value = anchor.textContent;
    hiddenValues.appendChild(hiddenInput);
  });

  const lengthInput = document.createElement('input');
  lengthInput.type = 'hidden';
  lengthInput.name = `${id}_length`;
  lengthInput.value = anchors.length;
  hiddenValues.appendChild(lengthInput);
};

// Check a submission botton state
ocForm.checkSubmitState = function(id) {
  const searchInput = ocForm.getSearchInput(id);
  const submitBotton = document.getElementById("_submitButton");

  if (searchInput.dataset.required === "false") {
    submitBotton.disabled = false;
  }
  else{
    const selectedItems = ocForm.getSelectedItems(id);
    const anchors = Array.from(selectedItems.getElementsByTagName('a'));
    submitBotton.disabled = (anchors.length === 0);
  }
}

// Add a selected item to the display inputs.
// triggerDynamic controls whether the Dynamic Form Widget is re-evaluated after
// the item is added. User actions pass true; programmatic set-value cascades pass
// false to avoid re-triggering the source and looping.
ocForm.addSelectedItem = function(id, triggerDynamic = true) {
  const searchInput = ocForm.getSearchInput(id);
  const selectedItems = ocForm.getSelectedItems(id);
  const validSuggestions = ocForm.getValidSuggestions(id);
  const selectedText = searchInput.value;
  const scriptOverwriteFlag = searchInput.dataset.scriptFlag === "true";
  const submitOverwriteFlag = searchInput.dataset.submitFlag === "true";

  const addBadge = () => {
    const badge = document.createElement('a');
    badge.href = "#";
    let bgColor, textColor;
    if (scriptOverwriteFlag) {
      bgColor = 'bg-primary';
      textColor = 'text-color';
    }
    else if (submitOverwriteFlag) {
      bgColor = 'bg-danger-subtle';
      textColor = 'text-dark';
    }
    else {
      bgColor = 'bg-warning';
      textColor = 'text-dark';
    }
    badge.classList.add('badge', 'rounded-pill', bgColor, textColor, 'p-2', 'text-decoration-none');

    badge.textContent = selectedText;

    const validSuggestionItems = ocForm.validSuggestionItems(id);

    Array.from(validSuggestionItems).some(li => {
      if (li.textContent.trim() === selectedText) {
        badge.setAttribute('data-value', li.getAttribute('data-value'));
        return true; // Escape loop
      }
    });

    badge.addEventListener('click', (event) => {
      event.preventDefault();
      selectedItems.removeChild(badge);
      ocForm.updateHiddenValues(id);
      ocForm.checkSubmitState(id);
      const contentType = scriptOverwriteFlag ? 'script' : submitOverwriteFlag ? 'submit' : undefined;
      ocForm.updateArea(contentType, id);
    });

    selectedItems.appendChild(badge);
    ocForm.updateHiddenValues(id);
    ocForm.checkSubmitState(id);
    searchInput.value = '';
    ocForm.updateAddButtonState(id);
    // updateArea() also runs execDynamicWidget(); when neither flag is set we run
    // it directly so this multi_select can act as a Dynamic Form Widget source.
    if (scriptOverwriteFlag) ocForm.updateArea('script', id);
    if (submitOverwriteFlag) ocForm.updateArea('submit', id);
    if (triggerDynamic && !scriptOverwriteFlag && !submitOverwriteFlag) ocForm.execDynamicWidget(id);
  };

  if (selectedText.trim() !== "") {
    addBadge();
  }
};

// Load files and updates the file selector interface dynamically.
ocForm.loadFiles = function(scriptName, currentPath, key, showFiles, homeDir, isFromButton) {
  const selectedPath = document.getElementById("oc-modal-data-" + key);
  if (isFromButton) {
    currentPath = selectedPath.dataset.path;
  }

  const parts = currentPath.split('/');
  let subPath = "";
  const linkedParts = parts.map(part => {
    if (part) {
      subPath += "/" + part;
      return ` <a href="#" onclick="ocForm.loadFiles('${scriptName}', '${subPath}', '${key}', ${showFiles}, '${homeDir}', false)">${part}</a> `;
    }
    else {
      return ''; // Avoid empty string for root directory
    }
  });

  const files_or_directory = scriptName + "/_file_or_directory";
  fetch(`${files_or_directory}?path=${encodeURIComponent(currentPath)}`)
    .then(response => response.json())
    .then(data => {
      selectedPath.dataset.path = currentPath;
      selectedPath.innerHTML = `<a href='#' onclick="ocForm.loadFiles('${scriptName}', '${homeDir}', '${key}', ${showFiles}, '${homeDir}', false)">&#x1f3e0;</a> `;
      const parentPath = currentPath.replace(/\/+$/, '').split('/').slice(0, -1).join('/') || '/';
      selectedPath.innerHTML += `<a href='#' onclick="ocForm.loadFiles('${scriptName}', '${parentPath}', '${key}', ${showFiles}, '${homeDir}', false)" style="text-decoration:none;">&#x2B06;&#xFE0F;</a> `;
      selectedPath.innerHTML += linkedParts.join('/');

      if (data.type === 'directory' && !selectedPath.dataset.path.endsWith("/")) {
        selectedPath.dataset.path += "/";
        selectedPath.innerHTML += "/";
      }
    });

  const checkbox = document.getElementById("oc-modal-checkbox-" + key);
  const filespath = scriptName + "/_files";
  fetch(`${filespath}?path=${encodeURIComponent(currentPath)}`)
    .then(response => response.json())
    .then(data => {
      const tbody = document.getElementById('oc-modal-tbody-' + key);
      tbody.innerHTML = '';
      if(!data.files){ return; }

      data.files.forEach(file => {
        if (file.type === 'file' && !showFiles) {
          return;
        }
        const row = document.createElement('tr');
        const typeCell = document.createElement('td');
        typeCell.innerHTML = file.type === 'file' ? '&#x1f4c4;' : '&#x1F4C1;';
        typeCell.className = 'text-center';

        const pathCell = document.createElement('td');
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = file.name;
        link.dataset.path = file.path;

        link.onclick = function(e) {
          e.preventDefault();
          ocForm.loadFiles(scriptName, file.path, key, showFiles, homeDir, false);
        };

        pathCell.appendChild(link);
        row.appendChild(typeCell);
        row.appendChild(pathCell);

        if (file.name.startsWith(".") && checkbox.checked) {
          row.style.display = "none";
        }

        tbody.appendChild(row);
      });
    });
};

// Hide or show hidden files based on the checkbox state.
ocForm.hideHidden = function(key) {
  const checkbox = document.getElementById("oc-modal-checkbox-" + key);
  const tbody = document.getElementById("oc-modal-tbody-" + key);
  const rows = Array.from(tbody.getElementsByTagName("tr"));

  rows.forEach(row => {
    const cell = row.getElementsByTagName("td")[1];
    const name = cell.textContent || cell.innerText;

    if (name.startsWith(".")) {
      row.style.display = checkbox.checked ? "none" : "";
    }
  });
};

// Handle the click event on table rows to navigate between directories.
ocForm.handleRowClick = function(event, key, showFiles, scriptName, homeDir) {
  let target = event.target;
  while (target && target.nodeName !== "TR") {
    target = target.parentNode;
  }

  if (target && target.nodeName === "TR") {
    const t = target.querySelector('td:nth-child(2) a');
    ocForm.loadFiles(scriptName, t.dataset.path, key, showFiles, homeDir, false);
  }
};

// Sort the table rows based on the selected column and direction.
ocForm.sortTable = function(key, columnIndex, direction) {
  const tbody = document.getElementById("oc-modal-tbody-" + key);
  const rows = Array.from(tbody.rows);

  rows.sort((a, b) => {
    const x = a.getElementsByTagName("TD")[columnIndex].innerHTML.toLowerCase();
    const y = b.getElementsByTagName("TD")[columnIndex].innerHTML.toLowerCase();

    return direction === "asc" ? (x > y ? 1 : -1) : (x < y ? 1 : -1);
  });

  rows.forEach(row => tbody.appendChild(row));
};

// Toggle the sort direction for a column and sorts the table.
ocForm.toggleSort = function(key, columnIndex) {
  const button = document.getElementById(`oc-modal-button-${key}-${columnIndex}`);
  const direction = button.getAttribute('data-direction');

  ocForm.sortTable(key, columnIndex, direction);
  if (direction === 'asc') {
    button.innerHTML = '&#9650;';
    button.setAttribute('data-direction', 'desc');
  }
  else {
    button.innerHTML = '&#9660;';
    button.setAttribute('data-direction', 'asc');
  }
};

// Filter table rows based on the input value and hides hidden files.
ocForm.filterRows = function(key) {
  const input = document.getElementById("oc-modal-filter-" + key).value.toLowerCase();
  const tbody = document.getElementById("oc-modal-tbody-" + key);
  const rows = Array.from(tbody.getElementsByTagName("tr"));

  rows.forEach(row => {
    const cell = row.getElementsByTagName("td")[1];
    const name = cell.innerText;
    row.style.display = name.toLowerCase().includes(input) ? "" : "none";
  });

  ocForm.hideHidden(key);
};

// Check if an element is selected (e.g., a checkbox or radio button).
ocForm.isElementChecked = function(id) {
  const element = document.getElementById(id);
  if(element.disabled) return false;

  if (element.tagName === "OPTION") {
    return element.selected;
  }
  else if (element.tagName === "INPUT") {
    return element.checked;
  }
  else if (element.tagName === "LI") {
    // multi_select option: "checked" means a selected badge with this label exists.
    const key = element.dataset.key;
    const input = document.getElementById(key);
    if (input && input.disabled) return false;
    if (ocForm.multiSelectDisabledIndexes[element.textContent] !== undefined) return false;

    const selectedItems = ocForm.getSelectedItems(key);
    if (!selectedItems) return false;
    return Array.from(selectedItems.getElementsByTagName('a'))
             .some(a => a.textContent === element.textContent);
  }
  else {
    console.error("Unknown Tag");
  }
};

// Get a parent div.
ocForm.getParentDiv = function(key, widget, size) {
  switch (widget) {
  case 'number':
  case 'text':
  case 'email':
    if (size > 1) { key = key + "_1"; }
    break;
  case 'radio':
  case 'checkbox':
    key = key + "_1";
    break;
  }

  return document.getElementById(key).closest('.mb-3');
}

// Show a widget.
ocForm.showWidget = function(key, widget, size) {
  if (key === "_script_content") {
    document.getElementById(key).style.display = 'block';
    document.getElementById("label_" + key).style.display = 'block';
    document.getElementById('_form_layout').classList.add('row-cols-lg-2');
    document.getElementById("_form_container").style.removeProperty("max-width");

    if (typeof ocForm.refreshEditorLayout === 'function') {
      window.requestAnimationFrame(() => ocForm.refreshEditorLayout());
    }
  }
  else {
    const parent = ocForm.getParentDiv(key, widget, size);
    if (parent) {
      parent.style.display = 'block';
    }
  }
};

// Hide a widget.
ocForm.hideWidget = function(key, widget, size) {
  if (key === "_script_content") {
    document.getElementById(key).style.display = 'none';
    document.getElementById("label_" + key).style.display = 'none';
    document.getElementById('_form_layout').classList.remove('row-cols-lg-2');
    document.getElementById("_form_container").style.maxWidth = '960px';

    if (typeof ocForm.refreshEditorLayout === 'function') {
      window.requestAnimationFrame(() => ocForm.refreshEditorLayout());
    }
  }
  else {
    const parent = ocForm.getParentDiv(key, widget, size);
    if (parent) {
      parent.style.display = 'none';
    }
  }
};

// Split the string into a key and a number.
ocForm.splitKeyAndNumber = function(str) {
  const match = str.match(/^(.+?)_(\d+)$/);
  if (match) {
    const baseKey = match[1];
    const number  = match[2];
    return { baseKey, number };
  }
  else{
    const baseKey = str;
    const number  = null;
    return { baseKey, number };
  }
}

// Return a value of a form element based on its widget type.
ocForm.getValue = function(key, widget) {
  let e = null;
  switch (widget) {
  case 'number':
  case 'text':
  case 'email':
    e = document.getElementById(key);
    if(e && !e.disabled) return e.value;
    break;
  case 'select':
    const sKey = ocForm.splitKeyAndNumber(key);
    e = document.getElementById(sKey.baseKey);
    if (e && !e.disabled && "selectedIndex" in e && e.selectedIndex !== -1) {
      const sValue = e.options[e.selectedIndex].dataset.value;
      try {
  return (sKey.number !== null) ? JSON.parse(sValue)[Number(sKey.number)-1] : sValue;
      }
      catch {
  // If JSON.parse throws an error.
  // For example, if the key is "hoge_1" but multiple items are not defined.
  return sValue;
      }
    }
    break;
  case 'multi_select':
    const mKey = ocForm.splitKeyAndNumber(key);
    const items = ocForm.getSelectedItems(mKey.baseKey);
    if(!items.disabled && !document.getElementById(mKey.baseKey).disabled){
      const aTags = items.getElementsByTagName('a');
      if (aTags) {
  return Array.from(aTags).map(a => {
    if (ocForm.multiSelectDisabledIndexes[a.textContent] !== undefined){
      return null;
    }
    else {
      const mValue = a.getAttribute('data-value') ?? a.textContent;
      try {
        return (mKey.number !== null) ? JSON.parse(mValue)[Number(mKey.number)-1] : mValue;
      }
      catch {
        return mValue;
      }
    }
  }).filter(value => value !== null);
      }
    }
    break;
  case 'radio':
    const rKey = ocForm.splitKeyAndNumber(key);
    for (const e of document.getElementsByName(rKey.baseKey)) {
      if (e.checked && !e.disabled) {
  const rValue = e.dataset.value;
  try {
          return (rKey.number !== null) ? JSON.parse(rValue)[Number(rKey.number)-1] : rValue;
  }
  catch {
    return rValue;
  }
      }
    }
    break;
  case 'checkbox':
    const cKey = ocForm.splitKeyAndNumber(key);
    const checkboxDiv = document.getElementById(cKey.baseKey + '_1').closest('div');
    const divs = checkboxDiv.parentElement.querySelectorAll('div');
    let value = [];
    divs.forEach(div => {
      const checkbox = div.querySelector('input[type="checkbox"]');
      if (checkbox !== null && checkbox.checked && !checkbox.disabled) {
        const cValue = checkbox.dataset.value;
  try {
    if (cKey.number !== null) {
            value.push(JSON.parse(cValue)[cKey.number-1]);
    }
    else {
            value.push(cValue);
    }
  }
  catch {
    value.push(cValue);
  }
      }
    });
    return value;
  case 'path':
    if (!document.getElementById(key).disabled) {
      return document.getElementById(key).value;
    }
    break;
  }

  return null;
}

// Return a directory name.
ocForm.dirname = function(path) {
  if (path == null) return "";

  path = String(path);
  if (path === "") return ".";　// If path is empty, return "."

  // Remove trailing slashes (except when the entire path is just "/")
  path = path.replace(/\/+$/, "");

  // Find the last "/"
  const index = path.lastIndexOf("/");

  // If no "/" exists, return "."
  if (index === -1) return ".";

  // If the result is empty (e.g. "/foo" → ""), return "/"
  const dir = path.slice(0, index);
  return dir === "" ? "/" : dir;
}

// Return a base name.
ocForm.basename = function(path) {
  if (path == null) return "";

  path = String(path);

  // Remove trailing slashes (e.g. "/foo/bar///" → "/foo/bar")
  path = path.replace(/\/+$/, "");

  // Find the last "/" and return the substring after it
  const index = path.lastIndexOf("/");

  // If no "/" exists, return the whole string
  if (index === -1) return path;

  return path.slice(index + 1);
}

// Return value with zero padding
ocForm.zeroPadding = function(num, length) {
  return num === "" ? "" : String(num).padStart(length, '0');
}

// Evaluate calc(...) expression
function safeEval(expr) {
  if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
    throw new Error("Invalid character is included.");
  }
  return Function(`return (${expr})`)();
}

function evalCalc(expr) {
  try {
    const parts = expr.split(",").map(s => s.trim()); // e.g. ["1 + (2 * 3)", "3", OC_ROUNDING_FLOOR]
    const valueExpr = parts[0] ?? "";
    if (valueExpr === "") return "";
    const value = safeEval(valueExpr); // 7
    const decimals = Number(parts[1]); // 3
    const rounding = parts[2];         // OC_ROUNDING_FLOOR

    // Check values
    if (!Number.isFinite(value)) throw new Error("Expression did not evaluate to a finite number.");
    if (!Number.isInteger(decimals) || decimals < 0) throw new Error("decimalPlaces must be a non-negative integer.");

    const factor = 10 ** decimals;
    const n = value * factor;  // Helper: avoid floating error a bit

    let rounded;
    if (rounding === "OC_ROUNDING_ROUND") {
      rounded = (n >= 0 ? Math.floor(n + 0.5) : Math.ceil(n - 0.5)) / factor;
    } else if (rounding === "OC_ROUNDING_FLOOR") {
      rounded = Math.floor(n) / factor;
    } else if (rounding === "OC_ROUNDING_CEIL") {
      rounded = Math.ceil(n) / factor;
    } else {
      throw new Error(`Unknown roundingMode: ${rounding}`);
    }

    return rounded.toFixed(decimals);
  } catch (e) {
    console.error(e.message);
    return "";
  }
}

// Output lines in the script contents.
ocForm.showLine = function(selectedValues, line, keys, widgets, canHide, separators) {
  // Check if line should be made visible
  for (const k in keys) {
    const value = ocForm.getValue(keys[k], widgets[k]);
    if ((value === null || value === "") && canHide[k] === false) return;
  }

  for (const k in keys) {
    let value = ocForm.getValue(keys[k], widgets[k]);
    value = typeof value === "number" ? String(value) : value;
    if (value != null && !Array.isArray(value)) { // If nothing is checked in the checkbox, value = [].
      const escapeSequences = {
  "\\n": "\n",
  "\\t": "\t",
  "\\r": "\r",
  "\\\\": "\\",
  "\\\"": "\"",
  "\\'": "'"
      };
      value = value.replace(/\\[ntr\\'"]/g, match => escapeSequences[match]);
    }

    if (value === null && canHide[k] === true) {
      value = ""
    }

    if (value !== null) {
      if (canHide[k] === true) {
        keys[k] = ":" + keys[k];
      }

      switch (widgets[k]) {
      case "checkbox":
      case "multi_select":
        if (separators[k] !== null){
          let tmp_value = "";
          for (let i = 0; i < value.length; i++) {
            tmp_value += value[i];
            tmp_value += (i !== value.length - 1) ? separators[k] : "";
          }
          line = (tmp_value) ? line.replace("#{" + keys[k] + "}", tmp_value) : "";
        }
        else {
          let tmp_line = "";
          for (let i = 0; i < value.length; i++) {
            tmp_line += line.replace("#{" + keys[k] + "}", value[i]);
            tmp_line += (i !== value.length - 1) ? "\n" : "";
          }
          line = tmp_line;
        }
        break;
      case "number":
      case "text":
      case "email":
      case "select":
      case "radio":
      case "path":
        line = line.replace(new RegExp(`#{${keys[k]}}`, "g"), value);
        break;
      }
    }
  }

  // After variable substitution, replace the #{zeropadding(..)} section with the calculated result.
  line = line.replace(/#\{zeropadding\(([^}]*)\)\}/g, (_, expr) => {
    const idx   = expr.lastIndexOf(",");      // "10, 3", "calc(2 * 3), 3" or "calc(2 * 3, 4), 3"
    let value   = expr.slice(0, idx).trim();  // "10", "calc(2 * 3)", "calc(2 * 3, 4)"
    const width = expr.slice(idx + 1).trim(); // "3"

    // If the first argument is calc(...), evaluate it using the same logic as #{calc(...)}
    const m = value.match(/^calc\((.*)\)$/);
    if (m) { // m[1] is the inner expression, e.g. "2 * 3"
      value = evalCalc(m[1]);
    }

    return ocForm.zeroPadding(value, width);
  });

  // After variable substitution, replace the #{calc(..)} section with the calculated result.
  line = line.replace(/#\{calc\(([^}]*)\)\}/g, (_, expr) => {
    return evalCalc(expr);
  });

  // After variable substitution, replace the #{dirname(..)} section with the calculated result.
  line = line.replace(/#\{dirname\((.*?)\)\}/g, (match, inner) => {
    return ocForm.dirname(inner);
  });

  // After variable substitution, replace the #{basename(..)} section with the calculated result.
  line = line.replace(/#\{basename\((.*?)\)\}/g, (match, inner) => {
    return ocForm.basename(inner);
  });

  if (line) {
    selectedValues.push(line);
  }
}

// Field-owned lines.
//
// A pane (the script pane or the submit pane) shows a template rendered with
// the form's values. Each template line renders as one segment, zero or more
// pane lines (a hidden line renders none; a checkbox with no separator renders
// one per ticked option), and the pane records which segment every line it
// shows came from, so that changing a field rewrites only that field's lines:
//
//   ocForm.panes[name].segments  one per template line, in template order:
//                                {keys: [field ids the line holds], fixed, lines: [rendered text]}
//   ocForm.panes[name].owners    one per pane line: the index of its segment,
//                                or null for a line the researcher wrote
//
// ocForm.lineSegment(name, n) and ocForm.fieldLines(name, key) read the record.

ocForm.panes = {};

// Start a template line's segment in segments and return its lines, for the
// generated updateScriptContents() and updateSubmitContents() to fill. A
// fixed segment is locked though it holds no field. A form with an editable
// region fixes every line outside it, the two marker lines included, and the
// marker that opens it is the one fixed segment a line may be added after.
ocForm.templateLine = function(segments, keys, fixed = false, opensRegion = false) {
  const segment = { keys: keys, fixed: fixed, opensRegion: opensRegion, lines: [] };
  segments.push(segment);
  return segment.lines;
};

// Whether a segment's lines are locked: it holds a field, or the form fixes it.
ocForm.segmentLocked = function(segment) {
  return segment.fixed || segment.keys.length > 0;
};

// The lines of a pane's text; an empty pane has none.
ocForm.paneLines = function(text) {
  return text === "" ? [] : text.split('\n');
};

// Each line of segments, with the index of its segment.
ocForm.renderedLines = function(segments) {
  const lines = [];
  segments.forEach((segment, i) => {
    segment.lines.forEach(text => lines.push({ text: text, owner: i }));
  });
  return lines;
};

// Owners for lines, by matching them in order to the rendered lines of
// segments (a longest common subsequence); a line that matches none is the
// researcher's.
ocForm.matchOwners = function(segments, lines) {
  const rendered = ocForm.renderedLines(segments);
  const n = rendered.length, m = lines.length;
  const lcs = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = rendered[i].text === lines[j]
                ? lcs[i + 1][j + 1] + 1
                : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const owners = new Array(m).fill(null);
  for (let i = 0, j = 0; i < n && j < m;) {
    if (rendered[i].text === lines[j]) { owners[j] = rendered[i].owner; i++; j++; }
    else if (lcs[i + 1][j] >= lcs[i][j + 1]) { i++; }
    else { j++; }
  }
  return owners;
};

// Show a pane: render(segments) fills segments from the form's values. The
// pane shows text when given one (a cached or re-rendered script), else the
// rendered template.
ocForm.initPane = function(name, area, render, text = null) {
  const segments = [];
  render(segments);
  const pane = { area: area, render: render, segments: segments };
  ocForm.panes[name] = pane;

  if (text === null) {
    const rendered = ocForm.renderedLines(segments);
    area.value = rendered.map(line => line.text).join('\n');
    pane.owners = rendered.map(line => line.owner);
  }
  else {
    area.value = text;
    pane.owners = ocForm.matchOwners(segments, ocForm.paneLines(text));
  }
  pane.text = area.value;
  ocForm.watchLockedLines(name);
};

// Keep a pane's record in step with an edit the researcher made in it. The
// edit replaced one run of the old text with new text; lines outside the run
// keep their owners. Of the lines the run touched, a line keeps the owner of
// the old line whose text it still starts or ends with, and every other line
// is the researcher's.
ocForm.paneEdited = function(name) {
  const pane = ocForm.panes[name];
  if (!pane) return;

  const before = pane.text, after = pane.area.value;
  if (before === after) return;

  let start = 0;
  while (start < before.length && start < after.length && before[start] === after[start]) start++;
  let end = 0;
  while (end < before.length - start && end < after.length - start &&
         before[before.length - 1 - end] === after[after.length - 1 - end]) end++;

  const removedEnd = before.length - end;                  // the run is before[start, removedEnd)
  const inserted   = after.slice(start, after.length - end);
  const count      = (s) => s.split('\n').length - 1;
  const first      = count(before.slice(0, start));        // the old lines the run touched
  const last       = count(before.slice(0, removedEnd));
  const added      = count(inserted);                      // the run spans added + 1 new lines

  const ownerOf = (n) => pane.owners[n] ?? null;
  const keepsHead = start > 0 && before[start - 1] !== '\n';
  const keepsTail = removedEnd < before.length && before[removedEnd] !== '\n';

  let owners;
  if (added === 0) {
    owners = [keepsHead ? ownerOf(first) ?? (keepsTail ? ownerOf(last) : null)
            : keepsTail ? ownerOf(last)
            : first === last ? ownerOf(first) : null];
  }
  else {
    owners = new Array(added + 1).fill(null);
    if (keepsHead) owners[0] = ownerOf(first);
    if (keepsTail) owners[added] = ownerOf(last);
  }

  const lines = ocForm.paneLines(after);
  owners = pane.owners.slice(0, first).concat(owners, pane.owners.slice(last + 1));
  if (owners.length !== lines.length) {
    owners = ocForm.matchOwners(pane.segments, lines);
  }

  // An edit that would change, join, split or remove a locked line, or add or
  // change a line outside the form's editable region, is undone.
  const lockedLines = (owners, lines) => owners.flatMap((owner, n) =>
    owner !== null && ocForm.segmentLocked(pane.segments[owner]) ? [[owner, lines[n]]] : []);
  const outsideLines = ocForm.linesOutsideRegion(pane.segments, pane.owners, ocForm.paneLines(before));
  const isSubsequence = (some, all) => { let i = 0; all.forEach(x => { if (x === some[i]) i++; }); return i === some.length; };
  if (JSON.stringify(lockedLines(owners, lines)) !==
      JSON.stringify(lockedLines(pane.owners, ocForm.paneLines(before))) ||
      !isSubsequence(ocForm.linesOutsideRegion(pane.segments, owners, lines), outsideLines)) {
    pane.area.value = before;
    if (pane.selection) pane.area.setSelectionRange(...pane.selection);
    return;
  }

  pane.owners = owners;
  pane.text = after;
};

// The researcher's lines of a pane that lie outside the form's editable
// region, given the pane's lines and their owners. A researcher's line lies
// between the segments of the template lines shown before and after it, and
// it is inside the region when a line may go between some two of the
// segments in that gap: after a segment that is not fixed, or after the one
// that opens the region. A form with no region fixes no segment, so every
// line is inside.
ocForm.linesOutsideRegion = function(segments, owners, lines) {
  const mayFollow = (i) => i < 0 ? !(segments[0] && segments[0].fixed)
                                 : !segments[i].fixed || segments[i].opensRegion;
  const outside = [];
  let previous = -1;
  owners.forEach((owner, n) => {
    if (owner !== null) { previous = owner; return; }
    let next = owners.slice(n).find(o => o !== null);
    if (next === undefined) next = segments.length;
    let inside = false;
    for (let i = previous; i < next && !inside; i++) inside = mayFollow(i);
    if (!inside) outside.push(lines[n]);
  });
  return outside;
};

// Remember where the caret was before an edit, to put it back if the edit is undone.
ocForm.paneEditing = function(name) {
  const pane = ocForm.panes[name];
  if (pane) pane.selection = [pane.area.selectionStart, pane.area.selectionEnd, pane.area.selectionDirection];
};

// Render a pane's template again with the form's values, rewriting only the
// lines of the segments whose text changed. A segment that showed no lines
// gets its new lines after the last line of an earlier segment.
ocForm.rerenderPane = function(name) {
  const pane = ocForm.panes[name];
  if (!pane) return;

  const segments = [];
  pane.render(segments);
  const lines  = ocForm.paneLines(pane.area.value);
  const owners = pane.owners.slice();

  segments.forEach((segment, i) => {
    const old = pane.segments[i];
    if (old && old.lines.join('\n') === segment.lines.join('\n') && old.lines.length === segment.lines.length) return;

    const held = [];
    owners.forEach((owner, n) => { if (owner === i) held.push(n); });

    let at;
    if (held.length > 0) {
      at = held[0];
      held.reverse().forEach(n => { lines.splice(n, 1); owners.splice(n, 1); });
    }
    else {
      const earlier = owners.findLastIndex(owner => owner !== null && owner < i);
      const later   = owners.findIndex(owner => owner !== null && owner > i);
      at = earlier >= 0 ? earlier + 1 : later >= 0 ? later : lines.length;
    }
    lines.splice(at, 0, ...segment.lines);
    owners.splice(at, 0, ...segment.lines.map(() => i));
  });

  pane.segments = segments;
  pane.owners = owners;
  pane.area.value = lines.join('\n');
  pane.text = pane.area.value;
};

// The segment the nth line of a pane came from, as {keys, lines}, or null for
// a line the researcher wrote.
ocForm.lineSegment = function(name, n) {
  const pane = ocForm.panes[name];
  const owner = pane ? pane.owners[n] : null;
  return owner === null || owner === undefined ? null : pane.segments[owner];
};

// Locked lines.
//
// A pane line is locked when its segment is (ocForm.segmentLocked): it holds
// a field, or the form fixes it. A researcher's edit that would change, join,
// split or remove a locked line is undone (ocForm.paneEdited); lines can still
// be added before and after one. Changing a field rewrites its lines as before.

// Why the nth line of a pane is locked, as its hover text, or null for a line
// that is not.
ocForm.lineLock = function(name, n) {
  const segment = ocForm.lineSegment(name, n);
  if (segment === null || !ocForm.segmentLocked(segment)) return null;
  if (segment.keys.length === 0) return "Fixed by the form";

  const labels = [...new Set(segment.keys.map(ocForm.fieldLabel))];
  const list = labels.length === 1 ? labels[0]
             : labels.slice(0, -1).join(', ') + ' and ' + labels[labels.length - 1];
  return `Set by ${list}`;
};

// The number of the locked line of a pane under the mouse event's pointer,
// or null. The pane's text is transparent over its highlighted copy, so the
// pointer is matched to the shaded lines of the copy.
ocForm.lockedLineAt = function(name, event) {
  const pane = ocForm.panes[name];
  const highlight = pane ? document.getElementById(`${pane.area.id}_highlight`) : null;
  if (!highlight) return null;

  for (const line of highlight.querySelectorAll('.oc-locked-line')) {
    const box = line.getBoundingClientRect();
    if (event.clientY >= box.top && event.clientY < box.bottom) return Number(line.dataset.line);
  }
  return null;
};

// Show a pane's locked lines' hover text as the mouse moves over them.
ocForm.watchLockedLines = function(name) {
  const area = ocForm.panes[name].area;
  area.addEventListener('mousemove', (event) => {
    const n = ocForm.lockedLineAt(name, event);
    area.title = n === null ? '' : ocForm.lineLock(name, n) ?? '';
  });

  // Clicking a field's line focuses the first field it holds.
  area.addEventListener('click', (event) => {
    const n = ocForm.lockedLineAt(name, event);
    const segment = n === null ? null : ocForm.lineSegment(name, n);
    const field = segment && segment.keys.length > 0 ? ocForm.fieldElement(segment.keys[0]) : null;
    if (field) field.focus();
  });
};

// The element to focus for a field: the input with its id, else the first
// of its inputs, as a radio or checkbox widget numbers them.
ocForm.fieldElement = function(key) {
  const own = document.getElementById(key);
  if (own && own.matches('input, select, textarea, button')) return own;
  return document.querySelector(`[name="${key}"], [name="${key}[]"], [id^="${key}_"]:is(input, select, textarea)`);
};

// The label a field shows, without its required mark; a field written key_n
// takes its own label if it has one, else its widget's.
ocForm.fieldLabel = function(key) {
  const base = key.replace(/_\d+$/, '');
  for (const id of [key, base]) {
    const label = document.getElementById(`label_${id}`);
    const text = label ? label.textContent.trim().replace(/\*$/, '') : '';
    if (text !== '') return text;
  }
  return key;
};

// Split highlighted HTML into one string per line, closing the elements open
// at the end of each line and opening them again on the next, so that every
// line is whole HTML.
ocForm.highlightedLines = function(html) {
  const lines = [];
  const open = [];
  let line = '';
  for (const [piece, tag] of html.matchAll(/(<[^>]*>)|[^<]+/g)) {
    if (tag) {
      if (tag.startsWith('</')) open.pop();
      else if (!tag.endsWith('/>')) open.push(tag);
      line += tag;
      continue;
    }
    const parts = piece.split('\n');
    parts.forEach((part, i) => {
      if (i > 0) {
        lines.push(line + open.map(t => `</${t.match(/^<(\w+)/)[1]}>`).reverse().join(''));
        line = open.join('');
      }
      line += part;
    });
  }
  lines.push(line);
  return lines;
};

// The numbers of the pane lines that hold the field key.
ocForm.fieldLines = function(name, key) {
  const pane = ocForm.panes[name];
  if (!pane) return [];
  const numbers = [];
  pane.owners.forEach((owner, n) => {
    if (owner !== null && pane.segments[owner].keys.includes(key)) numbers.push(n);
  });
  return numbers;
};

// Enable a widget.
ocForm.enableWidget = function(key, num, widget, size) {
  if (num !== null) {
    if (widget === "multi_select") {
      ocForm.multiSelectDisabledIndexes = {};
      // By assigning an empty object, all properties are removed.
      // This is fast, but may use a lot of memory since the original object is not deleted.
    }
    else {
      document.getElementById(key + "_" + num).disabled = false;
    }
  }
  else {
    switch (widget) {
    case 'number':
    case 'text':
    case 'email':
      if (size === null) {
        document.getElementById(key).disabled = false;
      }
      else {
        for (let i = 1; i <= size; i++) {
          document.getElementById(key + "_" + i).disabled = false;
        }
      }
      break;
    case 'checkbox':
    case 'radio':
      for (let i = 1; i <= size; i++) {
        document.getElementById(key + "_" + i).disabled = false;
      }
      break;
    case 'select':
    case 'multi_select':
    case 'path':
      document.getElementById(key).disabled = false;
      break;
    }
  }
};

// Disable a widget.
ocForm.disableWidget = function(key, num, widget, value, size) {
  if (num !== null) {
    if (widget === "multi_select") {
      ocForm.multiSelectDisabledIndexes[value] = num - 1;
    }
    else {
      document.getElementById(key + "_" + num).disabled = true;

      if (widget === 'select' && document.getElementById(key).selectedIndex === num - 1) {
  const selectBox = document.getElementById(key);

  // Find the next valid option
        const nextValidOption = Array.from(selectBox.options).find(option => !option.disabled)
  if (nextValidOption) {
    selectBox.value = nextValidOption.value;
  }
  else {
    selectBox.selectedIndex = -1;
  }
      }
      else if (widget === 'radio' && document.getElementsByName(key)[num - 1].checked) {
        document.getElementsByName(key)[num - 1].checked = false;
      }
    }
  }
  else {
    switch (widget) {
    case 'number':
    case 'text':
    case 'email':
      if (size === null) {
        document.getElementById(key).disabled = true;
      }
      else {
        for (let i = 1; i <= size; i++) {
          document.getElementById(key + "_" + i).disabled = true;
        }
      }
      break;
    case 'checkbox':
    case 'radio':
      for (let i = 1; i <= size; i++) {
        document.getElementById(key + "_" + i).disabled = true;
      }
      break;
    case 'select':
    case 'multi_select':
    case 'path':
      document.getElementById(key).disabled = true;
      break;
    }
  }
};

// Set a form element's attributes for initialization.
ocForm.setInitValue = function(key, num, widget, attr, value, fromId) {
  const id = num ? key + "_" + num : key;
  if ((attr === "min" || attr === "max" || attr === "step") && widget === "number") {
    const element = document.getElementById(id);
    if (element !== null) {
      element.setAttribute(attr, value);
    }
  }
  else if (attr === "label" || attr == "help") {
    const text = document.getElementById(attr + "_" + id);
    if (text !== null) {
      text.innerHTML = value;
      text.style.display = value !== "" ? "block" : "none";
    }
  }
  else if (attr === "required") {
    const label = document.getElementById("label_" + id);
    if (label !== null) {
      label.textContent = label.getAttribute('data-label');
      label.style.display = label.textContent !== "" ? "block" : "none";
      const required = label.getAttribute('data-required');
      let input;
      switch (widget) {
      case "radio":
  input = document.getElementById(id + "_1");
  break;
      case "checkbox":
  input = num == "" ? document.getElementById("label_" + id) : document.getElementById(id);
  break;
      default:
  input = document.getElementById(id);
      }

      if (required !== null && input !== null) {
  switch (widget) {
  case "checkbox":
    if (num === "") {
      input.setAttribute("data-required", value === "true");
      ocForm.validateCheckboxForSubmit(id);
    }
    else {
      if (value === "true") {
        input.setAttribute('required', '');
      }
      else {
        input.removeAttribute('required');
      }
    }
    break;
  case "multi_select":
    const submitBotton = document.getElementById("_submitButton");
    if (value === "true") {
      const selectedItems = ocForm.getSelectedItems(id);
      const anchors = Array.from(selectedItems.getElementsByTagName('a'));
      submitBotton.disabled = anchors.length === 0;
    }
    else {
      const searchInput = ocForm.getSearchInput(id);
      submitBotton.disabled = false;
    }
    break;
  default:
    if (value === "true") {
      input.setAttribute('required', '');
    }
    else {
      input.removeAttribute('required');
    }
  }
      }
    }
  }
  else if (attr === "value") {
    const isInitialLoad = typeof fromId === 'undefined';
    switch(widget){
    case 'number':
    case 'text':
    case 'email':
      if (isInitialLoad) {
        const element = document.getElementById(id);
        if (element !== null) {
          element.value = value;
        }
      }
      break;
    case 'select':
      if (key !== fromId) {
        const selectBox = document.getElementById(key);
        const options = Array.from(selectBox.querySelectorAll('option'));

        for (let i = 0; i < options.length; i++) {
          document.getElementById(key + "_" + (i+1)).disabled = false;
        }
      }
      break;
    case 'multi_select':
    case 'checkbox':
      break;
    case 'radio':
      const parentDiv = document.getElementById(key + '_1').closest('div');
      const divs = parentDiv.parentElement.querySelectorAll('div');

      divs.forEach(div => {
  const input = div.querySelector(`input[type="${widget}"]`);
  if (input !== null) {
      input.disabled = false;
  }
      });
      break;
    case 'path':
      if (isInitialLoad) {
        const modalData = document.getElementById("oc-modal-data-" + key);
        const element = document.getElementById(key);
        if (modalData !== null) {
          modalData.dataset.path = value;
        }
        if (element !== null) {
          element.value = value;
        }
      }
      break;
    } // end widget
  } // end if (attr === "value")
};

// Set a form element's attributes.
ocForm.setValue = function(key, num, widget, attr, value, fromId) {
  const id = num ? key + "_" + num : key;
  if ((attr === "min" || attr === "max" || attr === "step") && widget === "number") {
    ocForm.setInitValue(key, num, widget, attr, value, fromId);
  }
  else if (attr === "label" || attr === "help"){
    ocForm.setInitValue(key, num, widget, attr, value, fromId);
  }
  else if (attr === "required") {
    const label = document.getElementById("label_" + id);

    if (label !== null) {
      label.textContent = label.textContent.trim();
      label.style.display = label.textContent !== "" ? "block" : "none";
      const required = label.getAttribute('data-required');
      let input;
      switch (widget) {
      case "radio":
  input = document.getElementById(id + "_1");
  break;
      case "checkbox":
  input = num == "" ? document.getElementById("label_" + id) : document.getElementById(id);
  break;
      default:
  input = document.getElementById(id);
      }

      if (required !== null && input !== null) {
  switch (widget) {
  case "checkbox":
    if (num === "") {
      input.setAttribute("data-required", value === "true");
      ocForm.validateCheckboxForSubmit(id);
    }
    else {
      if (value === "true") {
        input.setAttribute('required', '');
      }
      else {
        input.removeAttribute('required');
      }
    }
    break;
  case "multi_select":
    const submitBotton = document.getElementById("_submitButton");
          if (value === "true") {
            const selectedItems = ocForm.getSelectedItems(id);
            const anchors = Array.from(selectedItems.getElementsByTagName('a'));
            submitBotton.disabled = anchors.length === 0;
          }
          else {
            const searchInput = ocForm.getSearchInput(id);
            submitBotton.disabled = false;
          }
    break;
  default:
    if (value === "true") {
      input.setAttribute('required', '');
    }
    else {
      input.removeAttribute('required');
    }
  }
      }

      if (required !== null) {
  if (value === "true" && required !== "true") {
    label.textContent = label.textContent.trim() + "*";
    label.style.display = "block";
  }
  else if (value === "false" && required === "true") {
    label.textContent = label.textContent.trim().slice(0, -1); // Delete only the last character (*).
    label.style.display = label.textContent !== "" ? "block" : "none";
  }
      }
    }
  }
  else if (attr === "value") {
    switch(widget){
    case 'number':
    case 'text':
    case 'email':
    case 'path': {
      const element = document.getElementById(id);
      if (element !== null) {
        element.value = value;
      }
      if (widget === 'path') {
        const modalData = document.getElementById("oc-modal-data-" + key);
        if (modalData !== null) {
          modalData.dataset.path = value;
        }
      }
      break;
    }
    case 'select':
      if (key !== fromId) {
        const selectBox = document.getElementById(key);
        const options = Array.from(selectBox.querySelectorAll('option'));

        for (let i = 0; i < options.length; i++) {
          if (options[i].textContent === value) {
            document.getElementById(key).selectedIndex = i;
          }
        }
      }
      break;
    case 'multi_select':
      if (key !== fromId) {
        // Skip if the badge already exists: execDynamicWidget() may run multiple
        // times, and unlike select/radio/checkbox, addSelectedItem() is not idempotent.
        const exists = Array.from(ocForm.getSelectedItems(key).getElementsByTagName('a'))
          .some(a => a.textContent === value);
        if (!exists) {
          ocForm.getSearchInput(key).value = value;
          // false: this is a cascaded set-value, so do not re-run the Dynamic Form Widget.
          ocForm.addSelectedItem(key, false);
        }
      }
      break;
    case 'radio':
    case 'checkbox':
      if (typeof fromId === 'undefined' || key !== fromId.replace(/_\d+$/, "")) { // hoge_2 -> hoge
  const parentDiv = document.getElementById(key + '_1').closest('div');
  const divs = parentDiv.parentElement.querySelectorAll('div');
  divs.forEach(div => {
    const input = div.querySelector(`input[type="${widget}"]`);
    if (input !== null) {
            const label = div.querySelector(`label[for="${input.id}"]`);
            if (label.textContent === value) {
              input.checked = true;
            }
    }
  });
      }
      break;
    } // end widget
  } // end if (attr === "value")
};

// Update the selected path in the file input.
ocForm.updatePath = function(key) {
  document.getElementById(key).value = document.getElementById("oc-modal-data-" + key).dataset.path;
};

// If a checkbox widget has `required: true` attribute and none are checked,
// disable the submit button. If any are checked, enable the submit button.
ocForm.validateCheckboxForSubmit = function(key) {
  const checkboxLabel = document.getElementById("label_" + key);
  if(checkboxLabel.getAttribute("data-required") === "false") {
    document.getElementById("_submitButton").disabled = false;
    return;
  }
  else{
    const checkboxDiv = document.getElementById(key + "_1").closest('div');
    const divs = checkboxDiv.parentElement.querySelectorAll('div');
    const isChecked = Array.from(divs).some(div => {
      const checkbox = div.querySelector('input[type="checkbox"]');
      return checkbox !== null && checkbox.checked && !checkbox.disabled;
    });
    document.getElementById("_submitButton").disabled = !isChecked;
  }
};

// Show "Submitting..." on the button and disable it to prevent double submission.
// The form is submitted normally and the button resets after page reload.
ocForm.submitEffect = function(action) {
  const btn = document.getElementById('_submitButton');
  btn.disabled = true;
  if (action === "submit") {
    btn.value = 'Submitting...';
  }
  else if (action === "save") {
    btn.value = 'Saving...';
  }
  // Note that confirm is not needed.

  btn.classList.remove('btn-primary');
  btn.classList.add('btn-warning');

  return true;
};
