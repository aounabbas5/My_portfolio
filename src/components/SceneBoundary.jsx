import React from 'react';

/** Keeps the site working if the 3D layer throws (e.g. WebGL context loss). */
export default class SceneBoundary extends React.Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.warn('3D scene disabled:', error);
  }

  render() {
    return this.state.failed ? this.props.fallback ?? null : this.props.children;
  }
}
