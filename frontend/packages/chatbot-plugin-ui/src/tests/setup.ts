import '@testing-library/jest-dom'

// jsdom does not implement scrollIntoView — polyfill for tests
HTMLElement.prototype.scrollIntoView = function scrollIntoView() {}
