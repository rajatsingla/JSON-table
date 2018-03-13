/**
https://github.com/rajatsingla/JSON-table
@description
JSON table is a minimal, yet flexible HTML table editor, where you can attach formatting to each cell and it gives you JSON output.

@author		rajatsingla.in
@company	Scroll Media, India
@created	12-03-2018
*/

(function () {
  'use strict'

var COLUMN_WIDTH = 16
var BORDER_WIDTH = 1
var DEFAULTOPTIONS = {
  formatOptions: [
    {
      type: 'button',
      name: 'bold',
      innerHTML: 'Bold'
    },
    {
      type: 'button',
      name: 'italic',
      innerHTML: 'Italic'
    },
    {
      type: 'radio',
      name: 'align',
      options: ['left', 'center', 'right']
    }
  ],
  gridColumns: 10,
  gridRows: 10,
  selectorWrongMsg: 'Can\'t find html element with given selector.',
  metaFieldsId: 'jt-meta-fields',
  formatOptionsId: 'jt-format-options',
  colBtnId: 'jt-col-btn',
  rowBtnId: 'jt-row-btn',
  tableMainClass: 'js-main-table',
  metaFields: [
    {
      type: 'string',
      name: 'name'
    },
    {
      type: 'string',
      name: 'description'
    }
  ]
}

function Grid (el, callback, rows, columns) {
  return this.init(el, callback, rows, columns)
}

Grid.prototype = {
  init: function (el, callback, rows, columns) {
    this.root = el
    this.callback = callback
    this.rows = rows
    this.columns = columns
    return this.render()
  },

  setCurrentCell: function (cell) {
    this.currentCell = cell
  },

  markCells: function () {
    [].forEach.call(this.cellsElements, function (el) {
      var cell = {
        column: parseInt(el.dataset.column, 10),
        row: parseInt(el.dataset.row, 10)
      }
      var active = this.currentCell &&
                           cell.row <= this.currentCell.row &&
                           cell.column <= this.currentCell.column

      if (active === true) {
        el.classList.add('active')
      } else {
        el.classList.remove('active')
      }
    }.bind(this))
  },

  generateCells: function () {
    var row = -1

    this.cells = []

    for (var i = 0; i < this.rows * this.columns; i++) {
      var column = i % this.columns

      if (column === 0) {
        row++
      }

      this.cells.push({
        column: column,
        row: row,
        active: false
      })
    }
  },

  html: function () {
    var width = this.columns * COLUMN_WIDTH + BORDER_WIDTH * 2
    var height = this.rows * COLUMN_WIDTH + BORDER_WIDTH * 2
    var html = '<div class="jt-grid clearfix" style="width:' + width + 'px;height:' + height + 'px;">'
    html += this.cellsHTML()
    html += '</div>'
    return html
  },

  cellsHTML: function () {
    var html = ''
    this.generateCells()
    this.cells.map(function (cell) {
      html += '<a href="#" class="jt-grid--cell' +
                      (cell.active === true ? ' active' : '') +
                      '" ' + 'data-row="' + cell.row +
                      '" data-column="' + cell.column + '">'
      html += '</a>'
    })
    return html
  },

  render: function () {
    this.root.innerHTML = this.html()
    this.cellsElements = this.root.querySelectorAll('a')
    this.bindEvents()
  },

  bindEvents: function () {
    [].forEach.call(this.cellsElements, function (el) {
      this.onMouseEnter(el)
      this.onClick(el)
    }.bind(this))
  },

  onMouseEnter: function (el) {
    var self = this
    var timer

    el.addEventListener('mouseenter', function () {
      clearTimeout(timer)

      var dataset = this.dataset

      timer = setTimeout(function () {
        self.currentCell = {
          column: parseInt(dataset.column, 10),
          row: parseInt(dataset.row, 10)
        }
        self.markCells()
      }, 50)
    })
  },

  onClick: function (el) {
    var self = this
    el.addEventListener('click', function (e) {
      e.preventDefault()
      self.callback(this.dataset.row, this.dataset.column)
    })
  }
}

function JSONTableKeyboardShortcuts (view, model) {
  return this.init(view, model)
}

JSONTableKeyboardShortcuts.prototype = {
  init: function (view, model) {
    this.view = view
    this.model = model
    this.bindUpKey()
    this.bindDownKey()
    this.bindUndoKey()
    this.bindRedoKey()
  },

  bindUpKey: function () {
    var self = this;
    this.view.container.addEventListener('keydown', function(event){
      if (event.keyCode === 38 && self.model.currentCell) {
        self.moveArrowUpDown(-1)
      }
    })
  },

  bindDownKey: function () {
    var self = this;
    this.view.container.addEventListener('keydown', function(event){
      if (event.keyCode === 40 && self.model.currentCell) {
        self.moveArrowUpDown(1)
      }
    })
  },

  moveArrowUpDown: function (direction, keyCode) {
    var currentCell = Object.assign({}, this.model.currentCell)
    currentCell.row = (Number(currentCell.row) + direction + this.model.meta.rows)%this.model.meta.rows
    this.view.focusCurrentCell(currentCell)
  },

  bindUndoKey: function () {

  },

  bindRedoKey: function () {

  }
}

function JSONTableView (container, formatOptions, metaFields) {
  return this.init(container, formatOptions, metaFields)
}

JSONTableView.prototype = {
  init: function (container, formatOptions, metaFields) {
    this.table = document.createElement('table')
    this.table.setAttribute('class', DEFAULTOPTIONS.tableMainClass)
    this.cellTag = 'td'
    this.container = container
    this.formatOptions = formatOptions
    this.metaFields = metaFields
    this.metaFieldsId = DEFAULTOPTIONS.metaFieldsId
    this.formatOptionsId = DEFAULTOPTIONS.formatOptionsId
    this.colBtnId = DEFAULTOPTIONS.colBtnId
    this.rowBtnId = DEFAULTOPTIONS.rowBtnId
  },

  insert: function (model) {
    var container = this.container
    if (container.firstChild) {
      container.replaceChild(this.table, container.childNodes[0])
    } else {
      container.append(this.table)
    }
    container.insertAdjacentHTML('afterbegin', this.formatOptionsContainer())
    this.updateFormatOptions()
    container.insertAdjacentHTML('afterbegin', this.metaFieldsContainer())
    this.updateMetaFields(model)
    container.insertAdjacentHTML('beforeend', this.utilButtons())
  },

  update: function (model) {
    this.table.innerHTML = this.html(model.meta.rows, model.meta.columns, model.data)
    if (model.currentCell) {
      this.focusCurrentCell(model.currentCell)
    }
    return true
  },

  updateFormatOptions: function (currentCellFormat) {
    var optionsContainer = JSONTable.qs('#' + this.formatOptionsId, this.container)
    optionsContainer.innerHTML = this.formatButtons(currentCellFormat) + this.formatRadioButtons(currentCellFormat)
  },

  formatRadioButtons: function (currentCellFormat) {
    var html = ''
    var radioButtons = this.formatOptions.filter(function (a) { return a.type === 'radio' })
    for (var i = 0; i < radioButtons.length; i++) {
      html += '<span>'
      for (var j = 0; j < radioButtons[i].options.length; j++) {
        var option = radioButtons[i].options[j]
        html += '<button data-code="5" data-formatkey="' +
                  radioButtons[i].name +
                  '" data-radioval="' +
                  option +
                  '" title="' +
                  option + ' ' + radioButtons[i].name +
                  '" class="' +
                  (currentCellFormat && currentCellFormat[radioButtons[i].name] === option ? ' active' : '') +
                  '"' +
                  (currentCellFormat ? ' ' : ' disabled') +
                  '>' +
                  option +
                  '</button>'
      }
      html += '</span>'
    }
    return html
  },

  formatButtons: function (currentCellFormat) {
    var html = ''
    var formatButtons = this.formatOptions.filter(function (a) { return a.type === 'button' })
    for (var i = 0; i < formatButtons.length; i++) {
      html += '<button data-code="5" data-formatkey="' +
              formatButtons[i].name +
              '" class="' +
              (currentCellFormat && currentCellFormat[formatButtons[i].name] ? ' active' : '') +
              '"' +
              (currentCellFormat ? ' ' : ' disabled') +
              '>' +
              formatButtons[i].innerHTML +
              '</button>'
    }
    return html
  },

  updateMetaFields: function (model) {
    var html = '';
    for (var i = 0; i < this.metaFields.length; i++) {
      var field = this.metaFields[i]
      if (field.type === "string"){
        html += field.name + ":" + '<input type="text" name="' + field.name + '" data-metakey="' + field.name + '" value="' + JSONTable.orEmpty(model.meta[field.name]) + '"><br>'
      } else if (field.type === "integer") {
        html += field.name + ":" + '<input type="number" name="' + field.name + '" data-metakey="' + field.name + '" value="' + JSONTable.orEmpty(model.meta[field.name]) + '"><br>'
      } else if (field.type === "select") {
        html += field.name + ":" +'<select' + ' data-metakey="' + field.name + '">'
        for (var j = 0; j < field.options.length; j++) {
          html += '<option value="' + field.options[j] + '"'
          html += (model.meta[field.name] === field.options[j] ? ' selected' : '')
          html += '>' + field.options[j] + '</option>'
        }
        html += '</select><br>'
      }
    }
    var metaFieldsContainer = JSONTable.qs('#' + this.metaFieldsId, this.container)
    metaFieldsContainer.innerHTML = html
  },

  focusCurrentCell: function (currentCell) {
    var selector = "[data-row='" + String(currentCell.row) + "'][data-col='" + String(currentCell.col) + "']"
    var cell = JSONTable.qs(selector, this.container)
    if (cell) {
      cell.focus()
      setTimeout(function () { JSONTable.setEndOfContenteditable(cell) }, 0)
    }
  },

  metaFieldsContainer: function () {
    var html = '<div class="jt-meta-fields" id="' + this.metaFieldsId + '">'
    html += '</div>'
    return html
  },

  formatOptionsContainer: function () {
    var html = '<div class="jt-format-options" id="' + this.formatOptionsId + '">'
    html += '</div>'
    return html
  },

  utilButtons: function () {
    var html =
          '<div class="jt-row-btn" id="' + this.rowBtnId + '">' +
          '<button data-code="3" title="add a row">+</button>' +
          '<button data-code="4" title="remove a row">-</button>' +
          '</div>' +

          '<div class="jt-col-btn" id="' + this.colBtnId + '">' +
          '<button data-code="1" title="add a column">+</button>' +
          '<button data-code="2" title="remove a column">-</button>' +
          '</div>'

    return html
  },

  html: function (rows, columns, data) {
    var html = ''
    for (var i = 0; i < rows; i++) {
      html += '<tr>'
      for (var j = 0; j < columns; j++) {
        html += this.cell(i, j, data[i][j])
      }
      html += '</tr>'
    }
    return html
  },

  cell: function (i, j, data) {
    var html = ''
    html += '<' + this.cellTag + ' contenteditable'
    html += " data-row='" + i + "'"
    html += " data-col='" + j + "'"
    html += " class='" + this.cellClassList(data.format) + "'"
    html += '>' + data.content + '</' + this.cellTag + '>'
    return html
  },

  cellClassList: function (format) {
    var classList = ''
    if (format && typeof format === 'object') {
      for (var property in format) {
        if (format.hasOwnProperty(property) && format[property]) {
          if (format[property] !== 'true' && format[property] !== true) {
            // case of radio buttons
            classList += 'jt-cell-' + format[property].replace(/ /g, '-') + ' '
          } else {
            classList += 'jt-cell-' + property.replace(/ /g, '-') + ' '
          }
        }
      }
    }
    return classList
  }
}

function JSONTableModel (tableData) {
  return this.init(tableData)
}

JSONTableModel.prototype = {
  init: function (tableData) {
    this.table_data = tableData || { meta: {}, data: [] }
    this.meta = this.table_data.meta
    this.data = this.table_data.data
    this.meta.rows = null
    this.meta.columns = null
    this.currentCell = null
    this.data_changed_event = new window.Event('data_changed')
  },

  isValidData: function () {
    var data = this.data
    return data && typeof data === 'object' &&
                data.constructor === Array &&
                data.length && data[0].length && data[0][0].hasOwnProperty('content')
  },

  setRowCol: function () {
    this.setRowColUtil(this.data.length, this.data[0].length)
  },

  setDefaultData: function (rows, columns) {
    this.setRowColUtil(rows, columns)
    this.updateDataAddRemoveExtraRowColumn()
  },

  setCurrentCell: function (cell) {
    this.currentCell = cell
  },

  updateContent: function (event) {
    var row = event.target.dataset.row
    var column = event.target.dataset.col
    this.data[row][column].content = event.target.innerHTML
  },

  updateMetaContent: function (event) {
    this.meta[event.target.dataset.metakey] = event.target.value
  },

  addARow: function () {
    this.meta.rows += 1
    this.updateDataAddRemoveExtraRowColumn()
  },

  removeARow: function () {
    if (this.meta.rows > 1) {
      this.meta.rows -= 1
      this.updateDataAddRemoveExtraRowColumn()
    }
  },

  addAColumn: function () {
    this.meta.columns += 1
    this.updateDataAddRemoveExtraRowColumn()
  },

  removeAColumn: function () {
    if (this.meta.columns > 1) {
      this.meta.columns -= 1
      this.updateDataAddRemoveExtraRowColumn()
    }
  },

  updateFormatOfCurrentCell: function (formatkey, event) {
    var currentCell = this.currentCell
    if (currentCell && event.target.dataset.radioval) {
      this.data[currentCell.row][currentCell.col].format[formatkey] = event.target.dataset.radioval
    } else if (currentCell) {
      var format = this.data[currentCell.row][currentCell.col].format
      this.data[currentCell.row][currentCell.col].format[formatkey] = !format[formatkey]
    }
  },

  updateDataAddRemoveExtraRowColumn: function () {
    var rows = window.Number(this.meta.rows)
    var columns = window.Number(this.meta.columns)
    while (this.data.length !== rows) {
      if (this.data.length > rows) {
        this.data.pop()
      } else if (this.data.length < rows) {
        this.data.push([])
      } else {
        break
      }
    }

    for (var i = 0; i < rows; i++) {
      while (this.data[i].length !== columns) {
        if (this.data[i].length > columns) {
          this.data[i].pop()
        } else if (this.data[i].length < columns) {
          this.data[i].push(this.defaultCellData())
        } else {
          break
        }
      }
    }
  },

  setRowColUtil: function (rows, columns) {
    this.meta.rows = Number(rows)
    this.meta.columns = Number(columns)
  },

  defaultCellData: function () {
    var data = {}
    data.content = ''
    data.format = {}
    return data
  }
}

function JSONTableController (view, model) {
  return this.init(view, model)
}

JSONTableController.prototype = {
  init: function (view, model) {
    this.view = view
    this.model = model
  },

  bindEvents: function () {
    var self = this
    this.bindEventOnCell('focus', function (e) {
      self.handleCellFocus(e)
    })
    this.bindEventOnCell('blur', function (e) {
      self.handleCellBlur(e)
    })
    this.bindEventOnFormatingOptions()
    this.bindEventOnMetaFields()
  },

  bindEventOnCell: function (type, handler) {
    JSONTable.delegate(this.view.table, this.view.cellTag, type, handler)
  },

  bindEventOnFormatingOptions: function () {
    var self = this
    var btnIds = [this.view.formatOptionsId, this.view.rowBtnId, this.view.colBtnId]
    for (var i = 0; i < btnIds.length; i++) {
      JSONTable.delegate(
        JSONTable.qs('#' + btnIds[i], this.view.container),
        'button',
        'click',
        function (e) {
          self.handleBtnClick(e)
        }
      )
    }
  },

  bindEventOnMetaFields: function () {
    var self = this
    JSONTable.delegate(
      JSONTable.qs('#' + this.view.metaFieldsId, this.view.container),
      'input, select',
      'change',
      function (e) {
        self.handleMetaChange(e)
      }
    )
  },

  handleCellFocus: function (event) {
    var self = this
    this.model.setCurrentCell(event.target.dataset)
    setTimeout(function () {
      self.view.updateFormatOptions(self.model.data[event.target.dataset.row][event.target.dataset.col].format)
    }, 16)
  },

  handleCellBlur: function (event) {
    var self = this
    this.model.updateContent(event)
    this.view.container.dispatchEvent(this.model.data_changed_event)
    setTimeout(function () {
      if (self.blur_created_by_button_click) {
        self.blur_created_by_button_click = false
      } else {
        self.view.updateFormatOptions()
      }
    }, 15)
  },

  handleMetaChange: function (event) {
    this.model.updateMetaContent(event)
    this.view.container.dispatchEvent(this.model.data_changed_event)
  },

  handleBtnClick: function (event) {
    this.blur_created_by_button_click = true
    event.preventDefault()
    event.stopPropagation()
    var dataset = event.target.dataset
    var code = window.Number(dataset.code)
    if (code === 1) {
      this.model.addAColumn()
    } else if (code === 2) {
      this.model.removeAColumn()
    } else if (code === 3) {
      this.model.addARow()
    } else if (code === 4) {
      this.model.removeARow()
    } else if (code === 5) {
      this.model.updateFormatOfCurrentCell(dataset.formatkey, event)
    }

    this.view.container.dispatchEvent(this.model.data_changed_event)

    this.view.update(this.model)
  }
}

function JSONTable (selector, options, tableData) {
  return this.init(selector, tableData, options)
}

JSONTable.prototype = {
  init: function (selector, tableData, options) {
    if (!options || typeof options !== 'object') {
      options = {}
    }
    this.gridRows = options.gridRows || DEFAULTOPTIONS.gridRows
    this.gridColumns = options.gridColumns || DEFAULTOPTIONS.gridColumns
    this.formatOptions = options.formatOptions || DEFAULTOPTIONS.formatOptions
    this.metaFields = options.metaFields || DEFAULTOPTIONS.metaFields
    this.container = JSONTable.qs(selector)
    if (!this.container) {
      throw DEFAULTOPTIONS.selectorWrongMsg
    }
    this.model = new JSONTableModel(tableData)
    this.view = new JSONTableView(this.container, this.formatOptions, this.metaFields)
    this.controller = new JSONTableController(this.view, this.model)
    this.setupTable()
  },

  setupTable: function () {
    if (this.model.isValidData()) {
      this.model.setRowCol()
      this.initTable()
    } else {
      this.grid = new Grid(this.container,
        function (row, column) {
          this.model.setDefaultData(Number(row) + 1, Number(column) + 1)
          this.initTable()
        }.bind(this),
        this.gridRows,
        this.gridColumns
      )
    }
  },

  initTable: function () {
    this.view.insert(this.model)
    this.view.update(this.model)
    this.controller.bindEvents()
    this.keyboardHandler = new JSONTableKeyboardShortcuts(this.view, this.model)
  }
}


  // helper functions
  JSONTable.qs = function (selector, scope) {
    return (scope || document).querySelector(selector)
  }

  JSONTable.qsa = function (selector, scope) {
    return (scope || document).querySelectorAll(selector)
  }

  JSONTable.on = function (target, type, callback, useCapture) {
    target.addEventListener(type, callback, !!useCapture)
  }

  JSONTable.delegate = function (target, selector, type, handler) {
    function dispatchEvent (event) {
      var targetElement = event.target
      var potentialElements = JSONTable.qsa(selector, target)
      var hasMatch = Array.prototype.indexOf.call(potentialElements, targetElement) >= 0

      if (hasMatch) {
        handler.call(targetElement, event)
      }
    }
    // https://developer.mozilla.org/en-US/docs/Web/Events/blur
    var useCapture = type === 'blur' || type === 'focus'
    JSONTable.on(target, type, dispatchEvent, useCapture)
  }

  // https://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity/3866442#3866442
  JSONTable.setEndOfContenteditable = function (contentEditableElement) {
    var range, selection
    if (document.createRange) {
      range = document.createRange()
      range.selectNodeContents(contentEditableElement)
      range.collapse(false)
      selection = window.getSelection()
      selection.removeAllRanges()
      selection.addRange(range)
    } else if (document.selection) {
      range = document.body.createTextRange()
      range.moveToElementText(contentEditableElement)
      range.collapse(false)
      range.select()
    }
  }

  JSONTable.orEmpty = function (entity) {
    return entity || ""
  }

  // polyfill for Object.assign
  if (typeof Object.assign != 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
      value: function assign(target, varArgs) { // .length of function is 2
        'use strict';
        if (target == null) { // TypeError if undefined or null
          throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);

        for (var index = 1; index < arguments.length; index++) {
          var nextSource = arguments[index];

          if (nextSource != null) { // Skip over if undefined or null
            for (var nextKey in nextSource) {
              // Avoid bugs when hasOwnProperty is shadowed
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
        return to;
      },
      writable: true,
      configurable: true
    });
  }

 window.JSONTableEditor = JSONTable
})()