<template>
  <div class="page-dark">
    <div class="container">
      <header class="test-card">
        <h1>nuxt-input-dialog</h1>
        <p class="subtitle">
          A modern Nuxt 3 / 4 input dialog module — text, password, number, textarea, select, autocomplete with create-new path semantics, validation, RTL.
        </p>
        <nav class="page-nav">
          <NuxtLink to="/">Quick demo</NuxtLink>
          <NuxtLink to="/test">Test page</NuxtLink>
        </nav>
      </header>

      <slot />
    </div>
  </div>
</template>
