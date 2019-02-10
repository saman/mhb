var path = require('path');
var filePath = path.join(__dirname, 'MHB_Master_EN.pdf')
var pdfToTextCommand = '/usr/local/bin/pdftotext'
var extract = require('pdf-text-extract')

var fs = require('fs');
var newFilePath = 'data.json';

var itemsList = [
  'Module name',
  'Workload',
  'Credits',
  'Semester',
  'Course: Teaching Form',
  'Choices in Module',
  'Course prerequiites',
  'Recommended proﬁciencies',
  'Content',
  'Learning objectives',
  'Implementation method',
  'Assessment modalities',
  'Partial module exams',
  'Course achievement',
  'Prerequisites for participation in module exam',
  'Prerequisites for obtaining credits',
  'Weight for overall grade',
  'Person responsible for the module',
  'Learning material, literature',
  'Remarks'
]

var options = {
  cwd: "./"
}

var config = {
  contentPages: {
    start: 2,
    end: 3
  }
}

extract(filePath, options, pdfToTextCommand, function (err, pages) {
  if (err) {
    console.dir(err)
    return
  }

  var content = [];
  var result = {};
  for (var i = config.contentPages.start - 1; i < config.contentPages.end; i++) {
    var page = pages[i].split("\n").filter(x => x.length);
    page.forEach((x, j) => {
      // Is the new line belong the upper line? (word-breaking)
      if (x.slice(-1) === '-') {
        x = x.slice(0, x.length - 1) + page[j + 1];
        page[j + 1] = '';
      }

      // remove all dots
      x = x.replace(/\. /g, '')

      // Just get the item with numbers
      var xArr = x.split(' ');
      if (parseFloat(xArr[0])) {
        var pageObj = {
          chapter: xArr[0],
          title: '',
          page: parseInt(xArr[xArr.length - 1]),
        }
        pageObj.title = x.replace(pageObj.chapter + ' ', '').replace(' ' + pageObj.page, '').trim();

        // detect the type of module
        if (pageObj.title.indexOf(":") > -1) {
          pageObj.type = pageObj.title.split(':')[0].trim();
          pageObj.title = pageObj.title.split(':')[1].trim();
        }
        content.push(pageObj);
      }
    });
  }

  content.forEach((x, j) => {
    if (content[j + 1]) {
      x.count = content[j + 1].page - x.page;
    } else {
      x.count = 2;
    }

    // categorize
    if (isInt(x.chapter)) {
      x.children = [];
      result[x.chapter] = x;
    } else {
      var chapter = parseInt(x.chapter);

      for (var k = parseInt(x.page); k < x.page + x.count; k++) {
        x.text = (x.text ? x.text + "\n\n" : '') + filterText(pages[k - 1]);
      }

      // parsing modules
      if (chapter === 3) {
        x.items = parseModule(x.text);
        delete x.text
      }

      result[chapter].children.push(x);
    }

  });

  fs.writeFile(newFilePath, JSON.stringify(result, 0, 5), function (err) {
    if (err) throw err;
    console.log('The file (' + newFilePath + ') has been saved!');
  })
})


function isInt(n) {
  return n % 1 === 0;
}

function filterText(text) {
  if (typeof (text) === 'string') {
    return text.split("\n").slice(2).join("\n").trim();
  }
  return '';
}

function parseModule(text) {
  var items = {}
  var textArr = text.replace(/\s\s\s+/g, "\n").split("\n");

  textArr.forEach((line, i) => {
    itemsList.forEach((label, j) => {
      if (line.indexOf(label) === 0) {
        nextLabel = itemsList[j + 1] ? itemsList[j + 1] : '-';
        items[changeFormat(label)] = makeField(textArr, i, label, nextLabel)
      }
    })
  })

  return items;
}

function makeField(textArr, i, label, nextLabel) {
  var text = '';
  for (var j = i + 1; j < textArr.length; j++) {
    if (textArr[j].indexOf(nextLabel) === 0) break;
    if (textArr[j]) {
      text += textArr[j] + ' ';
    }
  }
  // console.log(text.trim());
  return text.trim();
}

function changeFormat(label) {
  return label.toLowerCase().replace(':', '').replace(/\s/g, '_');
}