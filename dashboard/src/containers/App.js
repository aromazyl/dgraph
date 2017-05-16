import React from "react";
import { connect } from "react-redux";

import Sidebar from '../components/Sidebar';
import EditorPanel from '../components/EditorPanel';
import FrameList from '../components/FrameList';
import { runQuery, runQueryByShareId } from "../actions";
import { discardFrame } from '../actions/frames';
import { readCookie, eraseCookie } from './Helpers';

import "../assets/css/App.css";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      query: '',
      isQueryDirty: false
    };
  }

  componentDidMount = () => {
    const { handleRunQuery, match } = this.props;

    const { shareId } = match.params;
    if (shareId) {
      this.onRunSharedQuery(shareId);
    }

    // If playQuery cookie is set, run the query and erase the cookie
    // The cookie is used to communicate the query string between docs and play
    const playQuery = readCookie('playQuery');
    if (playQuery) {
      const queryString = decodeURI(playQuery);
      handleRunQuery(queryString).then(() => {
        eraseCookie('playQuery', { crossDomain: true });
      });
    }
  }

  // saveCodeMirrorInstance saves the codemirror instance initialized in the
  // <Editor /> component so that we can access it in this component. (e.g. to
  // focus)
  saveCodeMirrorInstance = (codemirror) => {
    this._codemirror = codemirror;
  }

  handleUpdateQuery = (val, done = () => {}) => {
    const isQueryDirty = val.trim() !== '';

    this.setState({ query: val, isQueryDirty }, done);
  }

  // focusCodemirror sets focus on codemirror and moves the cursor to the end
  focusCodemirror = () => {
    const cm = this._codemirror;
    const lastlineNumber = cm.doc.lastLine();
    const lastCharPos = cm.doc.getLine(lastlineNumber).length;

    cm.focus();
    cm.setCursor({ line: lastlineNumber, ch: lastCharPos });
  }

  handleSelectQuery = (val) => {
    this.handleUpdateQuery(val, this.focusCodemirror);
  }

  handleClearQuery = () => {
    this.handleUpdateQuery('', this.focusCodemirror);
  }

  handleRunQuery = (query) => {
    const { _handleRunQuery } = this.props;

    _handleRunQuery(query, () => {
      this.setState({ isQueryDirty: false, query: '' });
    });
  }

  onRunSharedQuery(shareId) {
    const { handleRunSharedQuery } = this.props;

    handleRunSharedQuery(shareId).catch(e => {
      console.log(e);
    });
  }

  render = () => {
    const { query, isQueryDirty } = this.state;
    const { handleDiscardFrame, frames } = this.props;

    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content">
          <div className="container-fluid">
            <div className="row justify-content-md-center">
              <div className="col-sm-12">
                <EditorPanel
                  query={query}
                  isQueryDirty={isQueryDirty}
                  onRunQuery={this.handleRunQuery}
                  onUpdateQuery={this.handleUpdateQuery}
                  onClearQuery={this.handleClearQuery}
                  saveCodeMirrorInstance={this.saveCodeMirrorInstance}
                />
              </div>

              <div className="col-sm-12">
                <FrameList
                  frames={frames}
                  onDiscardFrame={handleDiscardFrame}
                  onSelectQuery={this.handleSelectQuery}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
}

const mapStateToProps = state => ({
  frames: state.frames.items
});

const mapDispatchToProps = dispatch => ({
  _handleRunQuery(query, done = () => {}) {
    return dispatch(runQuery(query))
      .then(done);
  },
  handleRunSharedQuery(shareId) {
    return dispatch(runQueryByShareId(shareId));
  },
  handleDiscardFrame(frameID) {
    dispatch(discardFrame(frameID));
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(App);
