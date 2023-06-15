class PageParser {
  categoryNode
  brandNode
  nameNode
  priceNode
  badPriceNode

  constructor() {
    this.categoryNode = this.#getElementByAttributeValue('itemprop', 'category')
    this.brandNode = this.#getElementByAttributeValue('itemprop', 'brand')
    this.nameNode = this.brandNode.parentNode.children[1]
    this.priceNode = this.#getElementByAttributeValue('itemprop', 'offers').children[0]
    this.badPriceNode = this.priceNode.parentNode.parentNode.children[1].children[0]

    // this.#disableBrandLink()
  }

  getProductData() {
    let productData = {
      category: this.categoryNode.innerText,
      brand: this.brandNode.innerText.trim(),
      name: this.nameNode.innerText,
      price: this.priceNode.innerText,
      badPrice: this.badPriceNode.innerText,
    }

    return productData
  }

  #disableBrandLink() {
    this.brandNode.href = '#'
    let clonedNode = this.brandNode.cloneNode(true)
    this.brandNode.replaceWith(clonedNode)
  }

  #getElementByAttributeValue(attribute, value) {
    return document.querySelectorAll(`[${attribute}=${value}]`)[0]
  }
}

class StylesLoader {
  #customStylesheet = `
        .body {
            box-sizing: border-box;
        }

        .selection {
            padding: 5px;
            color: #001E33;
            cursor: pointer;
            border: 2px solid rgba(217, 217, 217, 0.01);
            border-radius: 3px;
        }

        .selection:hover {  
            border: 2px solid #0094FF;
            background: rgba(0, 148, 255, 0.22);
            box-shadow: 0px 0px 25px rgba(0, 148, 255, 0.27);
        }

        .selection:active {
            border: 2px solid #006FC0;
            box-shadow: 0px 0px 7px rgba(0, 111, 192, 0.27);
        }

        .banned {
            color: red !important;
        }

        .bannedFrame {
            border: 10px solid red;
            background: #FFDCDC;
        }


        .nontification {
            position: absolute;
            top:50%;
            left:50%;
            transform: translate(-50%, -50%);
            color: #0094FF;
            display: flex;
            justify-content: center;
            align-items: center;
            width: fit-content;
            padding: 15px 40px;
            font-weight: bold;
            background: rgba(0, 148, 255, 0.22);
            box-shadow: 0px 0px 25px rgba(0, 148, 255, 0.27);
            border-radius: 13px;
            border: 2px solid #0094FF;
            pointer-events: none;
            tranition: all 0.3s;
            opacity: 0;
          }
    `
  #pageParser
  #modalNontification
  #banHammer

  constructor(pageParser) {
    this.#addStylesToHTML(this.#customStylesheet)
    this.#pageParser = pageParser

    this.#banHammer = new BanHammer(pageParser, this)

    this.#modalNontification = new ModalNontification()
  }

  setStyles() {
    this.#iterateThroughPageParserPropsAddStylesAndListeners()

    if (this.#banHammer.checkBrandInArray()) {
      document.body.classList.add('bannedFrame')
      document.getElementsByTagName('header').style.background = 'red'
    }
  }

  #iterateThroughPageParserPropsAddStylesAndListeners() {
    for (var prop in this.#pageParser) {
      if (Object.prototype.hasOwnProperty.call(this.#pageParser, prop)) {
        let currentNode = this.#pageParser[prop]

        if (this.#banHammer.checkBrandInArray()) {
          this.#addClassnameToNode(currentNode, 'banned')
        } else {
          this.#addClassnameToNode(currentNode, 'selection')
          this.#addCopyListenerToNode(currentNode, currentNode.innerText)
        }
      }
    }
  }

  #addCopyListenerToNode(node, clipData) {
    node.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(clipData)
        this.#modalNontification.showModal('Content copied to clipboard')
      } catch (err) {
        this.#modalNontification.showModal('Failed to copy')
      }
    })
  }

  #addClassnameToNode(node, className) {
    node.classList.add(className)
  }

  #addStylesToHTML(stylesheet) {
    const styleSheet = document.createElement('style')
    styleSheet.innerText = stylesheet
    document.head.appendChild(styleSheet)
  }
}

class ModalNontification {
  showModal(text) {
    let modal = document.createElement('div')
    modal.innerText = text
    modal.classList.add('nontification')

    if (this.#checkIfModalAlreadyExists()) {
      document.getElementsByClassName('nontification')[0].remove()
    }
    document.body.append(modal)

    modal.style.opacity = 1

    setTimeout(() => {
      modal.style.opacity = 0
    }, 1200)
  }

  #checkIfModalAlreadyExists() {
    return document.getElementsByClassName('nontification').length > 0 ? true : false
  }
}

class BanHammer {
  #listOfBannedBrands = [
    'Ла прери',
    'Acqua di Parma',
    'Aerin',
    'Armani',
    'Aveda',
    'AVENE',
    'Bottega Veneta',
    'Calvin Klein',
    'CERAVE',
    'Chanel',
    'Chloe',
    'Clarins',
    'Cle de Peau',
    'Clinicque',
    'Davidoff',
    'Dior',
    'Dyson',
    'Escada',
    'Estée Lauder',
    'Filorga',
    'Givenchy',
    'Gucci',
    'Gucci Make Up',
    'Guerlain',
    'Hugo Boss',
    'Joop',
    'Kylie (декор и уход)',
    'KYLIE COSMETICS',
    'Kylie Skin',
    'LA ROCHE-POSAY',
    'Lacoste',
    'Lamel Professional',
    'Lancaster',
    'Lancome',
    'Lancaster Sun',
    'Laura Mercier',
    'LN Pro',
    'Maison Francis Kurkdjian',
    'Make up for ever',
    'Marc Jacobs',
    'Miu Miu',
    'My blend',
    'PRADA',
    'RICHARD MAISON DE PARFUM',
    'Roberto Cavalli',
    'Sensai',
    'Shiseido',
    'VERSACE',
    'VICHY',
    'WELEDA',
    'Zielinski & Rozen',
  ]
  #pageParser
  #styleLoader

  constructor(pageParser, styleLoader) {
    this.#pageParser = pageParser
    this.#styleLoader = styleLoader

    this.#fetchBrandsFromGoogleSheets()
  }

  checkBrandInArray() {
    let productData = this.#pageParser.getProductData()
    return productData.brand &&
      this.#listOfBannedBrands.find((el) => el.toLowerCase() === productData.brand.toLowerCase())
      ? true
      : false
  }

  async #fetchBrandsFromGoogleSheets() {
    const sheetId = '1Xb0lGvxA0JsXUPsm6vYYCQBnhhDfOxQ5vLnCKBxwteY'
    const base = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?`
    const sheetName = 'user-data'
    const query = encodeURIComponent('Select *')
    const url = `${base}&sheet=${sheetName}&tq=${query}`

    fetch(url)
      .then((res) => res.text())
      .then((rep) => {
        //Remove additional text and extract only JSON:
        const jsonData = JSON.parse(rep.substring(47).slice(0, -2))

        let data = []
        jsonData.table.rows.forEach((el) => data.push(el.c[0].v))

        this.#listOfBannedBrands = [...data]
        console.log(this.#listOfBannedBrands)
      })
      .then(() => {
        this.#styleLoader.setStyles()
      })
      .finally(() => {
        this.#styleLoader.setStyles()
      })
  }
}

class Main {
  static start() {
    const pageParser = new PageParser()
    const styleLoader = new StylesLoader(pageParser)
  }
}

if (document.readyState !== 'loading') {
  Main.start()
} else {
  document.addEventListener('DOMContentLoaded', function () {
    Main.start()
  })
}
