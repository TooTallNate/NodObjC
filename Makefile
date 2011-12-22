NODE ?= node
DOC_COMPILE = docs/compile.js
TESTS = $(wildcard test/*.js)
JS_FILES = $(wildcard lib/*.js)
DOC_DEPS := $(JS_FILES:.js=.html)
DOC_DEPS := $(DOC_DEPS:lib/%=docs/%)

test:
	@./test/run.sh $(TESTS)

docs/%.html: lib/%.js
	$(NODE) ./node_modules/.bin/dox < $< | $(NODE) $(DOC_COMPILE) $<

%.doc: lib/%.js
	$(NODE) ./node_modules/.bin/dox --debug < $<

docs: $(DOC_DEPS)

.PHONY: test docs
