"""
Text Summarizer using spaCy for NLP processing
"""

import re
import spacy
from collections import Counter
import math


class SpacySummarizer:
    def __init__(self):
        """Initialize the summarizer with the spaCy model"""
        # Load the spaCy model
        self.nlp = spacy.load("en_core_web_sm")
        
        # Initialize variables
        self.original_text = ""
        self.summary = ""
        self.summary_ratio = 0.3
        self.threshold_factor = 1.2
        self.doc = None
        self.sentences = []
        self.sentence_scores = {}

    def set_summary_ratio(self, ratio):
        """Set the summary ratio (proportion of sentences to include)."""
        try:
            ratio = float(ratio)
            if 0.1 <= ratio <= 0.9:
                self.summary_ratio = ratio
            else:
                print("Summary ratio must be between 0.1 and 0.9")
        except ValueError:
            print("Invalid summary ratio value")
    
    def set_threshold_factor(self, factor):
        """Set the threshold factor for controlling summary length."""
        try:
            factor = float(factor)
            if 0.1 <= factor <= 3.0:
                self.threshold_factor = factor
            else:
                print("Threshold factor must be between 0.1 and 3.0")
        except ValueError:
            print("Invalid threshold factor value")

    def preprocess_text(self, text):
        """Clean and preprocess the input text"""
        if not text or not text.strip():
            return ""
        
        # Clean text
        text = re.sub(r'\s+', ' ', text)  # Replace multiple whitespace with single space
        text = re.sub(r'\n+', '\n', text)  # Replace multiple newlines with single newline
        
        return text.strip()

    def get_sentence_scores(self):
        """Calculate sentence scores using TF-IDF approach"""
        # Calculate word frequencies
        word_freq = Counter()
        
        # Count word frequencies across all text
        for token in self.doc:
            if not token.is_stop and not token.is_punct and not token.is_space:
                word_freq[token.lemma_] += 1
                
        # Normalize word frequencies (Term Frequency)
        max_freq = max(word_freq.values()) if word_freq else 1
        norm_word_freq = {word: count/max_freq for word, count in word_freq.items()}
        
        # Calculate Inverse Document Frequency (IDF)
        doc_word_count = {}
        for sentence in self.sentences:
            sent_words = set()
            for token in sentence:
                if not token.is_stop and not token.is_punct and not token.is_space:
                    sent_words.add(token.lemma_)
            
            for word in sent_words:
                doc_word_count[word] = doc_word_count.get(word, 0) + 1
        
        num_sentences = len(self.sentences)
        idf = {word: math.log(num_sentences / (count + 1)) + 1 
               for word, count in doc_word_count.items()}
        
        # Score sentences
        sentence_scores = {}
        for i, sentence in enumerate(self.sentences):
            score = 0
            word_count = 0
            
            for token in sentence:
                if not token.is_stop and not token.is_punct and not token.is_space:
                    word = token.lemma_
                    tf = norm_word_freq.get(word, 0)
                    word_idf = idf.get(word, 0)
                    score += tf * word_idf
                    word_count += 1
            
            # Normalize by sentence length
            if word_count > 0:
                sentence_scores[i] = score / word_count
            else:
                sentence_scores[i] = 0
        
        return sentence_scores

    def summarize_text(self, text):
        """Generate a summary of the given text."""
        # Preprocess text
        cleaned_text = self.preprocess_text(text)
        if not cleaned_text:
            return ""
        
        self.original_text = cleaned_text
        
        # Process the text with spaCy
        self.doc = self.nlp(cleaned_text)
        
        # Extract sentences
        self.sentences = list(self.doc.sents)
        if not self.sentences:
            return ""
            
        # Score sentences
        self.sentence_scores = self.get_sentence_scores()
        
        # Determine how many sentences to include in summary
        adjusted_ratio = self.summary_ratio * self.threshold_factor
        num_sentences = max(1, int(len(self.sentences) * adjusted_ratio))
        
        # Get top sentences
        top_indices = sorted(
            self.sentence_scores.keys(), 
            key=lambda i: self.sentence_scores[i], 
            reverse=True
        )[:num_sentences]
        
        # Sort indices to maintain original order
        top_indices = sorted(top_indices)
        
        # Build summary
        summary_sentences = [self.sentences[i].text for i in top_indices]
        self.summary = ' '.join(summary_sentences)
        
        return self.summary

    def get_statistics(self):
        """Get statistics about the original text and summary."""
        if not self.original_text or not self.summary:
            return {
                "original_sentences": 0,
                "summary_sentences": 0,
                "original_words": 0,
                "summary_words": 0,
                "compression_ratio": 0
            }
        
        # Process summary with spaCy for accurate stats
        summary_doc = self.nlp(self.summary)
        
        # Count sentences
        original_sentences = len(self.sentences)
        summary_sentences = len(list(summary_doc.sents))
        
        # Count words (excluding punctuation and spaces)
        original_words = sum(1 for token in self.doc if not token.is_punct and not token.is_space)
        summary_words = sum(1 for token in summary_doc if not token.is_punct and not token.is_space)
        
        # Calculate compression ratio
        compression_ratio = 0
        if original_words > 0:
            compression_ratio = round((1 - summary_words / original_words) * 100, 2)
        
        return {
            "original_sentences": original_sentences,
            "summary_sentences": summary_sentences,
            "original_words": original_words,
            "summary_words": summary_words,
            "compression_ratio": compression_ratio
        }
