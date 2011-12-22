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

.PHONY: test docs
