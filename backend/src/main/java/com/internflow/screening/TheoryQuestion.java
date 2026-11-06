package com.internflow.screening;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "theory_questions")
@Getter
@Setter
@NoArgsConstructor
public class TheoryQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "test_id", nullable = false, updatable = false)
    private Long testId;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "question_text", nullable = false, length = 2000)
    private String questionText;

    @Column(name = "max_score", nullable = false)
    private int maxScore = 10;
}
