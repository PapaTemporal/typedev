<script lang="ts">
	import PracticeSession from '$lib/components/PracticeSession.svelte';
	import { normalize } from '$lib/typing/normalize';

	// From ripgrep (MIT), trimmed for the demo.
	const RUST_SNIPPET = normalize(`impl SearcherBuilder {
    pub fn build(&self) -> Searcher {
        let mut config = self.config.clone();
        if config.passthru {
            config.after_context = 0;
            config.before_context = 0;
        }
        let mut decode_builder = DecodeReaderBytesBuilder::new();
        decode_builder
            .encoding(self.config.encoding.as_ref().map(|e| e.0))
            .utf8_passthru(true)
            .strip_bom(self.config.bom_sniffing);
        Searcher {
            config,
            decode_builder,
            decode_buffer: RefCell::new(vec![0; 8 * (1 << 10)]),
            line_buffer: RefCell::new(self.config.line_buffer()),
            multi_line_buffer: RefCell::new(vec![]),
        }
    }
}`);
</script>

<h1 class="mb-6 text-2xl font-bold">Demo: Rust</h1>
<PracticeSession text={RUST_SNIPPET} mono />
