NODE ?= node
DOX ?= ./node_modules/.bin/dox
DOC_COMPILE = docs/compile.js
TESTS := $(wildcard test/*.js)
JS_FILES := $(wildcard lib/*.js)
DOC_DEPS := $(JS_FILES:.js=.html)
DOC_DEPS := $(DOC_DEPS:lib/%=docs/%)

test:
	@./test/run.sh $(TESTS)

docs/%.html: lib/%.js
	$(NODE) $(DOX) < $< | $(NODE) $(DOC_COMPILE) $(notdir $(basename $^)) > $@

%.doc: lib/%.js
	$(NODE) $(DOX) --debug < $<

docs: $(DOC_DEPS)

docclean:
	rm -f docs/*.html

gh-pages: docclean docs
	rm -rf /tmp/NodObjC_docs \
		&& cp -rf docs/*.html /tmp/NodObjC_docs \
		&& cp -rfd docs/assets /tmp/NodObjC_docs/assets \
		&& git checkout gh-pages \
		&& cp -rf /tmp/NodObjC_docs/* . \
		&& echo "done"

.PHONY: test docs
