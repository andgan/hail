package org.broadinstitute.hail.utils.richUtils

import org.apache.hadoop.fs.{FileStatus, PathIOException}
import org.apache.hadoop.io.{BytesWritable, NullWritable}
import org.apache.spark.rdd.RDD
import org.broadinstitute.hail.driver.HailConfiguration
import org.broadinstitute.hail.io.hadoop.{ByteArrayOutputFormat, BytesOnlyWritable}
import org.broadinstitute.hail.utils._

import scala.reflect.ClassTag

class RichRDDByteArray(val r: RDD[Array[Byte]]) extends AnyVal {
  def saveFromByteArrays(filename: String, header: Option[Array[Byte]] = None, deleteTmpFiles: Boolean = true) {
    val nullWritableClassTag = implicitly[ClassTag[NullWritable]]
    val bytesClassTag = implicitly[ClassTag[BytesOnlyWritable]]
    val hConf = r.sparkContext.hadoopConfiguration

    val tmpFileName = hConf.getTemporaryFile(HailConfiguration.tmpDir)

    header.foreach { str =>
      hConf.writeDataFile(tmpFileName + ".header") { s =>
        s.write(str)
      }
    }

    val rMapped = r.mapPartitions { iter =>
      val bw = new BytesOnlyWritable()
      iter.map { bb =>
        bw.set(new BytesWritable(bb))
        (NullWritable.get(), bw)
      }
    }

    RDD.rddToPairRDDFunctions(rMapped)(nullWritableClassTag, bytesClassTag, null)
      .saveAsHadoopFile[ByteArrayOutputFormat](tmpFileName)

    hConf.copyMerge(tmpFileName, filename, deleteTmpFiles, header.isDefined)
  }
}
