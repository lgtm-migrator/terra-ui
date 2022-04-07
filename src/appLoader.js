import 'src/style.css'

import _ from 'lodash/fp'
import ReactDOM from 'react-dom'
import { h } from 'react-hyperscript-helpers'
import RModal from 'react-modal'
import { HelloWorld } from 'src/components/HelloWorld'


const appRoot = document.getElementById('root')

RModal.defaultStyles = { overlay: {}, content: {} }
RModal.setAppElement(appRoot)
window.SATURN_VERSION = process.env.REACT_APP_VERSION

window._ = _

ReactDOM.render(h(HelloWorld), appRoot)
