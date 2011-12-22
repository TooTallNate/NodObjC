TESTS = $(wildcard test/*.js)
JS_FILES = $(wildcard lib/*.js)
DOC_DEPS := $(JS_FILES:.js=.html)
DOC_DEPS := $(DOC_DEPS:lib/%=docs/%)
DOC_COMPILE = "docs/compile.js"

test:
	@./test/run.sh $(TESTS)

docs/%.html: lib/%.js
	./node_modules/.bin/dox < "$<" | node $(DOC_COMPILE) "$<"

%.doc: lib/%.js
	./node_modules/.bin/dox --debug < "$<"

docs: $(DOC_DEPS)

.PHONY: test docs
