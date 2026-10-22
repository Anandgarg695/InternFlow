package com.internflow.screening;

import java.util.List;

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
@Table(name = "test_questions")
@Getter
@Setter
@NoArgsConstructor
public class TestQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "test_id", nullable = false, updatable = false)
    private Long testId;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Column(name = "question_text", nullable = false, length = 1000)
    private String questionText;

    @Column(name = "option_a", nullable = false, length = 300)
    private String optionA;

    @Column(name = "option_b", nullable = false, length = 300)
    private String optionB;

    @Column(name = "option_c", nullable = false, length = 300)
    private String optionC;

    @Column(name = "option_d", nullable = false, length = 300)
    private String optionD;

    @Column(name = "correct_option", nullable = false)
    private int correctOption;

    public List<String> options() {
        return List.of(optionA, optionB, optionC, optionD);
    }

    public void setOptions(List<String> values) {
        optionA = values.get(0);
        optionB = values.get(1);
        optionC = values.get(2);
        optionD = values.get(3);
    }
}