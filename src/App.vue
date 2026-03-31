<template>
  <div id="app">
    <AnkleAnalysis />
  </div>
</template>

<script>
import AnkleAnalysis from './components/AnkleAnalysis.vue'

export default {
  name: 'App',
  components: { AnkleAnalysis }
}
</script>

<style>
@import './assets/global.css';
</style>