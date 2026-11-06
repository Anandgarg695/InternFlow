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
@Table(name = "theory_answers")
@Getter
@Setter
@NoArgsConstructor
public class TheoryAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attempt_id", nullable = false, updatable = false)
    private Long attemptId;

    @Column(name = "question_id", nullable = false, updatable = false)
    private Long questionId;

    @Column(name = "answer_text", nullable = false, length = 4000)
    private String answerText;

    @Column
    private Integer score;

    @Column(length = 1000)
    private String feedback;
}
