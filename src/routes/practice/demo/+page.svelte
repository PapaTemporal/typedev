<script lang="ts">
	import PracticeSession from '$lib/components/PracticeSession.svelte';

	const DEMO_TEXT =
		'Alice was beginning to get very tired of sitting by her sister on the bank, ' +
		'and of having nothing to do: once or twice she had peeped into the book her ' +
		'sister was reading, but it had no pictures or conversations in it, "and what ' +
		'is the use of a book," thought Alice, "without pictures or conversations?"';
</script>

<h1 class="mb-6 text-2xl font-bold">Demo: prose</h1>
<PracticeSession text={DEMO_TEXT} />
