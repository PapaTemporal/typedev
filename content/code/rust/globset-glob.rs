use std::fmt::Write;
use std::path::{Path, is_separator};

use regex_automata::meta::Regex;

use crate::{Candidate, Error, ErrorKind, new_regex};

/// Describes a matching strategy for a particular pattern.
///
/// This provides a way to more quickly determine whether a pattern matches
/// a particular file path in a way that scales with a large number of
/// patterns. For example, if many patterns are of the form `*.ext`, then it's
/// possible to test whether any of those patterns matches by looking up a
/// file path's extension in a hash table.
#[derive(Clone, Debug, Eq, PartialEq)]
pub(crate) enum MatchStrategy {
    /// A pattern matches if and only if the entire file path matches this
    /// literal string.
    Literal(String),
    /// A pattern matches if and only if the file path's basename matches this
    /// literal string.
    BasenameLiteral(String),
    /// A pattern matches if and only if the file path's extension matches this
    /// literal string.
    Extension(String),
    /// A pattern matches if and only if this prefix literal is a prefix of the
    /// candidate file path.
    Prefix(String),
    /// A pattern matches if and only if this prefix literal is a prefix of the
    /// candidate file path.
    ///
    /// An exception: if `component` is true, then `suffix` must appear at the
    /// beginning of a file path or immediately following a `/`.
    Suffix {
        /// The actual suffix.
        suffix: String,
        /// Whether this must start at the beginning of a path component.
        component: bool,
    },
    /// A pattern matches only if the given extension matches the file path's
    /// extension. Note that this is a necessary but NOT sufficient criterion.
    /// Namely, if the extension matches, then a full regex search is still
    /// required.
    RequiredExtension(String),
    /// A regex needs to be used for matching.
    Regex,
}

impl MatchStrategy {
    /// Returns a matching strategy for the given pattern.
    pub(crate) fn new(pat: &Glob) -> MatchStrategy {
        if let Some(lit) = pat.basename_literal() {
            MatchStrategy::BasenameLiteral(lit)
        } else if let Some(lit) = pat.literal() {
            MatchStrategy::Literal(lit)
        } else if let Some(ext) = pat.ext() {
            MatchStrategy::Extension(ext)
        } else if let Some(prefix) = pat.prefix() {
            MatchStrategy::Prefix(prefix)
        } else if let Some((suffix, component)) = pat.suffix() {
            MatchStrategy::Suffix { suffix, component }
        } else if let Some(ext) = pat.required_ext() {
            MatchStrategy::RequiredExtension(ext)
        } else {
            MatchStrategy::Regex
        }
    }
}

/// Glob represents a successfully parsed shell glob pattern.
///
/// It cannot be used directly to match file paths, but it can be converted
/// to a regular expression string or a matcher.
#[derive(Clone, Eq)]
#[cfg_attr(feature = "arbitrary", derive(arbitrary::Arbitrary))]
pub struct Glob {
    glob: String,
    re: String,
    opts: GlobOptions,
    tokens: Tokens,
}

impl AsRef<Glob> for Glob {
    fn as_ref(&self) -> &Glob {
        self
    }
}

impl PartialEq for Glob {
    fn eq(&self, other: &Glob) -> bool {
        self.glob == other.glob && self.opts == other.opts
    }
}

impl std::hash::Hash for Glob {
    fn hash<H: std::hash::Hasher>(&self, state: &mut H) {
        self.glob.hash(state);
        self.opts.hash(state);
    }
}

impl std::fmt::Debug for Glob {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        if f.alternate() {
            f.debug_struct("Glob")
                .field("glob", &self.glob)
                .field("re", &self.re)
                .field("opts", &self.opts)
                .field("tokens", &self.tokens)
                .finish()
