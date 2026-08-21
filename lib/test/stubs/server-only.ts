/**
 * Test stub for the `server-only` package.
 *
 * The real module throws the moment it is imported outside a React Server
 * Component. That guard is correct in the app and useless in a unit test, so
 * vitest aliases the import here. It exports nothing, exactly like the real one.
 */
export {};
