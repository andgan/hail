package org.broadinstitute.hail.stats

import org.broadinstitute.hail.annotations.Annotation
import org.broadinstitute.hail.expr.{TDouble, TStruct}
import org.broadinstitute.hail.utils._
import org.broadinstitute.hail.variant.Genotype

object HWECombiner {
  def signature = TStruct("rExpectedHetFrequency" -> TDouble, "pHWE" -> TDouble)
}

class HWECombiner extends Serializable {
  var nHomRef = 0
  var nHet = 0
  var nHomVar = 0

  def merge(gt:Genotype): HWECombiner = {
    if (gt.isHomRef)
      nHomRef += 1
    else if (gt.isHet)
      nHet += 1
    else if (gt.isHomVar)
      nHomVar += 1

    this
  }

  def merge(other: HWECombiner): HWECombiner = {
    nHomRef += other.nHomRef
    nHet += other.nHet
    nHomVar += other.nHomVar

    this
  }

  def n = nHomRef + nHet + nHomVar
  def nA = nHet + 2 * nHomRef.min(nHomVar)

  def lh = LeveneHaldane(n, nA)

  def asAnnotation: Annotation = Annotation(divOption(lh.getNumericalMean, n).orNull, lh.exactMidP(nHet))
}
