package org.broadinstitute.hail

import breeze.linalg.{DenseMatrix, DenseVector}
import org.testng.annotations.Test

class TestUtilsSuite extends SparkSuite {

  @Test def matrixEqualityTest() {
    val M = DenseMatrix((1d, 0d), (0d, 1d))
    val M1 = DenseMatrix((1d, 0d), (0d, 1.0001d))
    val V = DenseVector(0d, 1d)
    val V1 = DenseVector(0d, 0.5d)

    TestUtils.assertMatrixEqualityDouble(M, DenseMatrix.eye(2))
    TestUtils.assertMatrixEqualityDouble(M, M1, 0.001)
    TestUtils.assertVectorEqualityDouble(V, 2d * V1)

    intercept[Exception](TestUtils.assertVectorEqualityDouble(V, V1))
    intercept[Exception](TestUtils.assertMatrixEqualityDouble(M, M1))
  }
}
